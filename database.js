const mongoose = require('mongoose');
const dbConfig = require('./config/db.config')
const { MongoMemoryServer, MongoMemoryReplSet } = require('mongodb-memory-server');
let mongod = null;

/**
 * Database connection routine, including a test environment route for memory server connection
 */
const connectDB = async () => {
  console.log("connectDB called")
  try {
    var dbUrl = `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}?replicaSet=rsName`;
    if (process.env.NODE_ENV === 'test') {
      console.log("test environment database")
      mongod = await MongoMemoryServer.create();
      dbUrl = mongod.getUri();
      // mongod = await MongoMemoryReplSet.create({replSet: {count: 3}});
      // dbUrl = mongod.getUri();
      console.log("dbUrl: "+  dbUrl)
    }

    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = { connectDB, disconnectDB };