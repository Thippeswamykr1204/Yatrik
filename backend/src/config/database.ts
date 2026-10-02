import mongoose from "mongoose";
import { config } from "./env.js";
import logger from "@/utils/logger.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    logger.info("✅ MongoDB connected successfully");

    // Connection event handlers
    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error", { error });
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB");
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info("✅ MongoDB disconnected gracefully");
  } catch (error) {
    logger.error("Error disconnecting MongoDB");
    throw error;
  }
};
