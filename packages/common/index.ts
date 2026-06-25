import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().min(3).max(100).email(),
  password: z.string().min(6),
  name: z.string().min(1).max(50).trim(), // ← ADD .trim()
});

export const SigninSchema = z.object({
  email: z.string().min(3).max(100).email(),
  password: z.string().min(6),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(50),
});
