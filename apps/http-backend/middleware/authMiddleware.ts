import "dotenv/config";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/db/prisma";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    res
      .status(500)
      .json({ error: "Server configuration error: JWT_SECRET missing" });
    return;
  }

  const rawToken = authHeader.trim();
  const token = rawToken.startsWith("Bearer ")
    ? rawToken.slice(7).trim()
    : rawToken;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || typeof decoded === "string") {
      res.status(401).json({ error: "Invalid Token format" });
      return;
    }

    const payload = decoded as jwt.JwtPayload;

    const userExists = await prisma.user.findFirst({
      where: { id: payload.id as string },
    });

    if (!userExists) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // FIX: Attach to req directly, NOT req.body (body is undefined for GET/DELETE)
    (req as any).user = {
      id: payload.id,
      email: payload.email,
    };

    next();
  } catch (error) {
    console.error("[AuthMiddleware] JWT verify error:", error);
    res.status(401).json({ error: "Invalid Token" });
  }
};
