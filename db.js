import mongoose from 'mongoose';

let cached = global.mongoose || { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new MongoDB connection');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    try {
      cached.promise = mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s
      });
    } catch (error) {
      console.error('Error initiating MongoDB connection:', error);
      throw error; // Rethrow to prevent caching a failed promise
    }
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully');
    return cached.conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    cached.promise = null; // Reset promise on failure
    throw error; // Rethrow to notify caller
  }
}
