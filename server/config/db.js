const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

  
    if (!uri || uri.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('📦 Using in-memory MongoDB for development');
      } catch (e) {
    
        
        uri = uri || 'mongodb://localhost:27017/ethara-ai';
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
