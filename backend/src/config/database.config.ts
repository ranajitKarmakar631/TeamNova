import mongoose from "mongoose";
import { config } from "./app.config";

const connectDatabase = async () => {
  try {
    if (!config.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to Mongo database");
  } catch (error) {
    console.error("Error connecting to Mongo database:", error);
    process.exit(1);
  }
};

export default connectDatabase;
