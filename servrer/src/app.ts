import express, { Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import connectDB from "./db/connection";

dotenv.config();
const app = express();

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);

//  route to test server
app.get("/", (req: Request, res: Response) => {
  res.send("Server and MongoDB are running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
