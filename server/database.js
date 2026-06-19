const mongoose = require('mongoose');
const config = require('./config');

/**
 * Database Connection Manager
 * Handles MongoDB connection with proper error handling and reconnection logic.
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.retryTimer = null;
    this.handlersRegistered = false;
  }

  /**
   * Connect to MongoDB once.
   */
  async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._attemptConnection();
    return this.connectionPromise;
  }

  /**
   * Keep retrying in development until MongoDB is available.
   */
  async connectWithRetry() {
    try {
      return await this.connect();
    } catch (error) {
      if (config.server.env !== 'development') {
        throw error;
      }

      await new Promise((resolve) => {
        console.log('Retrying database connection in 5 seconds...');
        this.retryTimer = setTimeout(resolve, 5000);
      });

      return this.connectWithRetry();
    }
  }

  /**
   * Internal method to attempt database connection.
   */
  async _attemptConnection() {
    try {
      mongoose.set('strictQuery', true);
      this._registerHandlers();

      await mongoose.connect(config.database.uri, config.database.options);

      console.log(`Connected to database: ${config.database.name}`);
      return mongoose.connection;
    } catch (error) {
      console.error('Database connection failed:', error.message);
      this._logConnectionHelp(error);
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Register process and mongoose event handlers once.
   */
  _registerHandlers() {
    if (this.handlersRegistered) return;

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      this.isConnected = false;
    });

    process.on('SIGINT', this._gracefulShutdown.bind(this));
    process.on('SIGTERM', this._gracefulShutdown.bind(this));
    process.on('SIGQUIT', this._gracefulShutdown.bind(this));

    this.handlersRegistered = true;
  }

  /**
   * Print targeted help for common MongoDB startup failures.
   */
  _logConnectionHelp(error) {
    const uri = config.database.uri || '';
    const isSrvLookupFailure = uri.startsWith('mongodb+srv://') && (
      error?.code === 'ETIMEOUT' ||
      error?.code === 'ENOTFOUND' ||
      error?.syscall === 'querySrv'
    );

    if (isSrvLookupFailure) {
      console.error('Atlas DNS lookup failed for the mongodb+srv URI.');
      console.error('Check your internet/DNS connection, VPN/firewall, and Atlas network access allowlist.');
      console.error('For local development, run MongoDB locally and set:');
      console.error('MONGODB_URI=mongodb://127.0.0.1:27017/attendance_system');
      return;
    }

    if (uri.startsWith('mongodb://') && error?.code === 'ECONNREFUSED') {
      console.error('Local MongoDB is not accepting connections.');
      console.error('Start the MongoDB service, or set MONGODB_URI to a reachable MongoDB/Atlas connection string.');
    }
  }

  /**
   * Graceful shutdown handler.
   */
  async _gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    try {
      await this.disconnect();
      console.log('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during database shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Check if database is connected.
   */
  isConnectedToDatabase() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status.
   */
  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      state: states[mongoose.connection.readyState],
      isConnected: this.isConnected,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  /**
   * Close database connection.
   */
  async disconnect() {
    try {
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      throw error;
    }
  }
}

const dbConnection = new DatabaseConnection();
module.exports = dbConnection;
