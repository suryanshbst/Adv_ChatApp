import { Router } from "express";
import { prisma } from "@repo/db/prisma";
import { CreateRoomSchema } from "@repo/common/config";

const router = Router();

// POST /api/room/create
router.post("/create", async (req, res) => {
  try {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      res
        .status(400)
        .json({
          error: "Invalid input data",
          details: parsedData.error.format(),
        });
      return;
    }

    const { name } = parsedData.data;
    const roomId = req.body.roomId;
    const adminId = (req as any).user?.id; // ← FIX HERE

    if (!roomId || !adminId) {
      res.status(400).json({ error: "Missing roomId or adminId" });
      return;
    }

    const room = await prisma.rooms.create({
      data: {
        id: roomId,
        slug: name,
        admin: adminId,
        users: {
          connect: { id: adminId },
        },
      },
    });

    res.status(201).json({ roomId: room.id, name: room.slug });
  } catch (error) {
    console.error("[RoomRouter POST /create] CRASH:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: String(error) });
  }
});

// POST /api/room/join
router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = (req as any).user?.id; // ← FIX HERE

    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const room = await prisma.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    await prisma.rooms.update({
      where: { id: roomId },
      data: {
        users: { connect: { id: userId } },
      },
    });

    res.status(200).json({ roomDetails: room });
  } catch (error) {
    console.error("[RoomRouter POST /join] CRASH:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: String(error) });
  }
});

// GET /api/room/all
router.get("/all", async (req, res) => {
  try {
    const userId = (req as any).user?.id; // ← FIX HERE

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rooms = await prisma.rooms.findMany({
      where: {
        users: { some: { id: userId } },
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("[RoomRouter GET /all] CRASH:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: String(error) });
  }
});

// DELETE /api/room/:roomId
router.delete("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user?.id; // ← FIX HERE

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const room = await prisma.rooms.findUnique({ where: { id: roomId } });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.admin !== userId) {
      res.status(403).json({ error: "Only the admin can delete this room" });
      return;
    }

    await prisma.rooms.delete({ where: { id: roomId } });
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("[RoomRouter DELETE /:roomId] CRASH:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: String(error) });
  }
});

export default router;
