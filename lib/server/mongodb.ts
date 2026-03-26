import mongoose from "mongoose";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required")
});

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const cached = globalForMongoose.mongooseConnection ?? {
  conn: null,
  promise: null
};

globalForMongoose.mongooseConnection = cached;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const env = envSchema.parse({
      MONGODB_URI: process.env.MONGODB_URI
    });

    cached.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: "task_life"
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
