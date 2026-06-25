import { Router } from "express";
import { prisma } from "@repo/db/prisma";
import { CreateRoomSchema } from "@repo/common/config";

const router = Router();

// CREATE ROOM — connects admin user to the room
router.post("/create", async (req, res) => {
  try {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ error: "Invalid input data" });
      return;
    }

    const { name } = parsedData.data;
    const roomId = req.body.roomId;
    const adminId = req.body.user?.id;

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
          connect: { id: adminId }, // ← CONNECTS admin to _RoomsToUser table
        },
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

// JOIN ROOM — connects joining user to the room
router.post("/join", async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.body.user?.id;

    if (!roomId) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    // Connect user to room (adds to _RoomsToUser join table)
    await prisma.rooms.update({
      where: { id: roomId },
      data: {
        users: {
          connect: { id: userId }, // ← CONNECTS user to _RoomsToUser table
        },
      },
    });

    res.status(200).json({
      roomDetails: room,
    });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET ALL ROOMS — returns rooms where user is connected (via many-to-many)
router.get("/all", async (req, res) => {
  try {
    const userId = req.body.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Fetch rooms where user is in the users[] relation
    const rooms = await prisma.rooms.findMany({
      where: {
        users: {
          some: {
            id: userId, // ← Finds rooms connected to this user
          },
        },
      },
    });

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE ROOM — admin only, cascades to messages
router.delete("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.body.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.admin !== userId) {
      res.status(403).json({ error: "Only the admin can delete this room" });
      return;
    }

    // Prisma will cascade delete all messages due to onDelete: Cascade
    await prisma.rooms.delete({
      where: { id: roomId },
    });

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
