import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://username:password@60.250.98.61:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'shortee';

// check the MongoDB URI
if (!MONGODB_URI) {
  throw new Error('Define the MONGODB_URI environmental variable');
}

// check the MongoDB DB
if (!MONGODB_DB) {
  throw new Error('Define the MONGODB_DB environmental variable');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  // check the cached.
  if (cachedClient && cachedDb) {
    // load from cache
    return {
      client: cachedClient,
      db: cachedDb,
    };
  }

  // set the connection options
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  try {
    // Connect to cluster
    const client = new MongoClient(MONGODB_URI, opts);
    await client.connect();
    const db = client.db(MONGODB_DB);

    // set cache
    cachedClient = client;
    cachedDb = db;

    return {
      client: cachedClient,
      db: cachedDb,
    };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('無法連接到 MongoDB 資料庫');
  }
}
