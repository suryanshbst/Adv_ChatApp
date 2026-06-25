import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";
import { prisma } from "@repo/db/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
const secret = JWT_SECRET;

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !secret) {
    res.status(401).json({ error: "Invalid Token" });
    return;
  }

  // Strip "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded === "string") {
      res.status(401).json({ error: "Invalid Token" });
      return;
    }

    const userExists = await prisma.user.findFirst({
      where: {
        id: (decoded as jwt.JwtPayload).id,
      },
    });

    req.body.user = decoded;
    req.body.username = userExists?.name;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid Token" });
  }
};
