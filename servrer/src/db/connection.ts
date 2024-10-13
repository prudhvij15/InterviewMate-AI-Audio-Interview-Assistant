import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const MONGODB_USERNAME: string = process.env.MONGODB_USERNAME!;
    const MONGODB_PASSWORD: string = process.env.MONGODB_PASSWORD!;
    const MONGODB_CLUSTER: string = process.env.MONGODB_CLUSTER!;
    const MONGODB_DBNAME: string = process.env.MONGODB_DBNAME!;

    const uri: string = `mongodb+srv://${MONGODB_USERNAME}${MONGODB_PASSWORD}@${MONGODB_CLUSTER}/${MONGODB_DBNAME}?retryWrites=true&w=majority`;

    console.log(uri);
    await mongoose.connect(uri);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
