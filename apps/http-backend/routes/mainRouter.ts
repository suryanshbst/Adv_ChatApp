import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import authRouter from "./authRouter";
import roomRouter from "./roomRouter";

const router = Router();

router.use("/auth", authRouter);
router.use("/room", authMiddleware, roomRouter);

export { router as mainRouter };
