import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string); // Verify the token
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

export default authMiddleware;
