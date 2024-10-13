import express, { Request, Response, NextFunction } from "express";
const bcrypt = require("bcrypt");
import User from "../models/User";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;
    // console.log(req.body);

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ msg: "User already exists" });
        return next();
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email,
        password: hashedPassword,
      });

      // Save user to database
      await user.save();

      res.status(201).json({ msg: "User registered successfully" });
      next();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        res.status(500).send("Server error");
      } else {
        console.error("Unexpected error:", error);
        res.status(500).send("Server error");
      }
      next();
    }
  }
);

router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.body);
    const { email, password } = req.body;

    try {
      // Find the user by username
      const user = await User.findOne({ email });
      //   console.log(user);
      if (!user) {
        res.status(401).json({ message: "USer not found" });
        return next();
      }

      const isMatch = await bcrypt.compare(password, user.password);
      console.log(isMatch);
      if (!isMatch) {
        res.status(401).json({ message: "Invalid password" });
        return next();
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: { email: user.email },
      });
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
      next();
    }
  }
);
export default router;
