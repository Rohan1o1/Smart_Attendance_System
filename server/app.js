const express = require("express");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");

// Import configuration and database
const config = require("./config");
const dbConnection = require("./database");

// Import services
const { faceRecognitionService } = require("./services");

// Import middleware
const {
  rateLimiter,
  securityHeaders,
  corsHeaders,
  sanitizeInput,
  validateIPAddress,
  requestLogger,
  errorHandler,
  notFoundHandler,
} = require("./middleware");

// Import routes
const routes = require("./middleware/routes");

/**
 * Express Application Setup
 */
class App {
  constructor() {
    this.app = express();
    this.port = config.server.port;

    // Initialize application
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  initializeMiddleware() {
    // Trust proxy (for deployment behind reverse proxy)
    this.app.set("trust proxy", 1);

    // Compression middleware
    this.app.use(compression());

    // Security headers
    this.app.use(securityHeaders);

    // CORS handling
    // Use permissive CORS in development (works well with Vite dev server)
    if (config.server.env === "development") {
      // use the npm 'cors' package to reliably handle preflight requests
      const cors = require("cors");
      this.app.use(cors({ origin: true, credentials: true }));
    }
    // Custom CORS headers (kept for stricter control in production)
    this.app.use(corsHeaders);

    // Request logging
    if (config.server.env === "development") {
      this.app.use(morgan("combined"));
    } else {
      this.app.use(morgan("common"));
    }

    // Custom request logger
    this.app.use(requestLogger);

    // IP address validation
    this.app.use(validateIPAddress);

    // Rate limiting
    this.app.use(rateLimiter);

    // Body parsing middleware
    this.app.use(
      express.json({
        limit: "10mb",
        verify: (req, res, buf, encoding) => {
          // Store raw body for signature verification if needed
          req.rawBody = buf;
        },
      }),
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
      }),
    );

    // Input sanitization
    this.app.use(sanitizeInput);

    // Serve static files
    this.app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Serve client build files in production
    if (config.server.env === "production") {
      this.app.use(express.static(path.join(__dirname, "../client/dist")));
    }

    console.log("✅ Middleware initialized");
  }

  /**
   * Initialize routes
   */
  initializeRoutes() {
    // API routes
    this.app.use("/api", routes);

    // Serve React app in production
    if (config.server.env === "production") {
      this.app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
      });
    }

    console.log("✅ Routes initialized");
  }

  /**
   * Initialize error handling
   */
  initializeErrorHandling() {
    // 404 handler (must be before error handler)
    this.app.use(notFoundHandler);

    // Global error handler (must be last)
    this.app.use(errorHandler);

    // Uncaught exception handler
    process.on("uncaughtException", (err) => {
      console.error("💥 Uncaught Exception:", err);
      console.error("Stack:", err.stack);

      // Perform graceful shutdown
      this.gracefulShutdown("uncaughtException");
    });

    // Unhandled promise rejection handler
    process.on("unhandledRejection", (reason, promise) => {
      console.error("💥 Unhandled Rejection at:", promise);
      console.error("Reason:", reason);

      // In development, log but don't crash the server
      if (config.server.env === "development") {
        console.warn(
          "⚠️  Development mode: Server continuing despite unhandled rejection",
        );
      } else {
        // Perform graceful shutdown in production
        this.gracefulShutdown("unhandledRejection");
      }
    });

    console.log("✅ Error handling initialized");
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    try {
      // Initialize face recognition service
      console.log("🧠 Initializing face recognition service...");
      await faceRecognitionService.initialize();
      console.log("✅ Face recognition service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize services:", error.message);

      // Don't exit the process, but log the warning
      console.warn(
        "⚠️  Server will start without face recognition capabilities",
      );
      console.warn(
        "⚠️  Please ensure face-api.js models are properly installed",
      );
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      console.log("🔗 Connecting to database...");
      if (config.server.env === "development") {
        try {
          const dbConnectPromise = dbConnection.connect();
          dbConnectPromise.catch(() => {});

          await Promise.race([
            dbConnectPromise,
            new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Database connection timed out during startup")),
                6000,
              );
            }),
          ]);
        } catch (error) {
          console.warn(
            "⚠️  Development mode: starting API without a database connection.",
          );
          console.warn(
            "⚠️  DB-backed routes will fail until MONGODB_URI is reachable.",
          );
        }
      } else {
        await dbConnection.connect();
      }

      // Initialize services
      await this.initializeServices();

      // Start HTTP server
      // Bind to 0.0.0.0 in development to accept connections from localhost IPv4/IPv6
      const listenHost =
        config.server.env === "development" ? "0.0.0.0" : config.server.host;
      this.server = this.app.listen(this.port, listenHost, () => {
        const addr = this.server.address();
        console.log("🚀 Server started successfully!");
        console.log(
          `📍 Server running on ${addr.address}:${addr.port} (${addr.family})`,
        );
        console.log(`🌐 Environment: ${config.server.env}`);
        console.log(`📊 Database: ${dbConnection.getConnectionStatus().name}`);

        if (config.server.env === "development") {
          console.log(`🔗 API URL: http://localhost:${this.port}/api`);
          console.log(
            `📚 API Documentation: http://localhost:${this.port}/api`,
          );
        }

        console.log("=".repeat(50));
      });

      // Handle server errors
      this.server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.error(`❌ Port ${this.port} is already in use`);
          console.error("💡 Try a different port or stop the existing process");
        } else {
          console.error("❌ Server error:", error);
        }
        process.exit(1);
      });

      // Graceful shutdown handlers
      process.on("SIGTERM", () => this.gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => this.gracefulShutdown("SIGINT"));
    } catch (error) {
      console.error("💥 Failed to start server:", error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new requests
    if (this.server) {
      this.server.close((error) => {
        if (error) {
          console.error("❌ Error closing server:", error);
        } else {
          console.log("✅ HTTP server closed");
        }
      });
    }

    try {
      // Close database connection
      await dbConnection.disconnect();

      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during graceful shutdown:", error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }
}

// Create and export app instance
const app = new App();

// Start server if this file is run directly
if (require.main === module) {
  app.start();
}

module.exports = app.getApp();
