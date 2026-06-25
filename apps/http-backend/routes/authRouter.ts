import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db/prisma";
import { CreateUserSchema, SigninSchema } from "@repo/common/config";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request body:", req.body); // ← ADD THIS for debugging

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
      console.error("Validation errors:", parsedData.error.format()); // ← ADD THIS
      res.status(400).json({
        error: "Invalid input data",
        details: parsedData.error.format(), // ← ADD THIS to see what's wrong
      });
      return;
    }

    const { email, password, name } = parsedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      name: user.name,
      userId: user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    console.log("Signin request body:", req.body); // ← ADD THIS

    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
      console.error("Validation errors:", parsedData.error.format()); // ← ADD THIS
      res.status(400).json({
        error: "Invalid input data",
        details: parsedData.error.format(), // ← ADD THIS
      });
      return;
    }

    const { email, password } = parsedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      name: user.name,
      userId: user.id,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
