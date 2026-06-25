import { Router } from "express";
import { prisma } from "@repo/db/prisma";
import { CreateRoomSchema } from "@repo/common/config";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ error: "Invalid input data" });
      return;
    }

    const { name } = parsedData.data;
    const roomId = req.body.roomId;
    const adminId = req.body.user.id;

    if (!roomId || !adminId) {
      res.status(400).json({ error: "Missing roomId or adminId" });
      return;
    }

    const room = await prisma.rooms.create({
      data: {
        id: roomId,
        slug: name,
        admin: adminId,
      },
    });

    res.status(201).json({
      roomId: room.id,
      name: room.slug,
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }

    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.status(200).json({
      roomDetails: room,
    });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const userId = req.body.user?.id;

    const rooms = await prisma.rooms.findMany({
      where: {
        admin: userId,
      },
    });

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
