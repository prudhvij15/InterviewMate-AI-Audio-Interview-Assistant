import express, { Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth";
import connectDB from "./db/connection";
import setupSocketIO from "./routes/socket";
import { createServer } from "http";

dotenv.config();
const app = express();
const server = createServer(app);

// Use CORS
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);

// Route to test server
app.get("/", (req: Request, res: Response) => {
  res.send("Server and MongoDB are running!");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Call the Socket.IO setup and pass the server instance
const io = setupSocketIO(server);
