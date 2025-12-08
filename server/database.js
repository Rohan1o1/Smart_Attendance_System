const mongoose = require('mongoose');
const config = require('./config');

/**
 * Database Connection Manager
 * Handles MongoDB connection with proper error handling and reconnection logic
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect() {
    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._attemptConnection();
    return this.connectionPromise;
  }

  /**
   * Internal method to attempt database connection
   */
  async _attemptConnection() {
    try {
      // Configure mongoose settings
      mongoose.set('strictQuery', true);
      
      // Connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      // Graceful shutdown handling
      process.on('SIGINT', this._gracefulShutdown.bind(this));
      process.on('SIGTERM', this._gracefulShutdown.bind(this));
      process.on('SIGQUIT', this._gracefulShutdown.bind(this));

      // Attempt connection
      await mongoose.connect(config.database.uri, config.database.options);
      
      console.log(`🔗 Connected to database: ${config.database.name}`);
      return mongoose.connection;

    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
      this.connectionPromise = null;
      
      // Retry connection after delay in development
      if (config.server.env === 'development') {
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(() => this.connect(), 5000);
      }
      
      throw error;
    }
  }

  /**
   * Graceful shutdown handler
   */
  async _gracefulShutdown(signal) {
    console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Check if database is connected
   */
  isConnectedToDatabase() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status
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
   * Close database connection
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;
