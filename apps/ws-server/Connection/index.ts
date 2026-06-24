import { WebSocket } from "ws";
import { type User, createUser, joinRoom, leaveRoom } from "../User/index";
import {
  type Room,
  createRoom,
  addUserToRoom,
  removeUserFromRoom,
  broadcastMessage,
} from "../Room/index";
import { prisma } from "@repo/db/prisma";
import jwt, { type JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;

// Main export: Initiates connection logic by attaching listeners using state tracking references
export function handleConnection(
  ws: WebSocket,
  users: User[],
  rooms: Room[],
): void {
  ws.on("message", async (message: string) => {
    try {
      const { command, roomId, msg, roomName, userName, token } =
        JSON.parse(message);

      // Verify JWT Token securely
      let userId: string;
      try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (!decoded || !decoded.id) {
          ws.send(JSON.stringify({ error: "Invalid token structure" }));
          return;
        }
        userId = decoded.id;
      } catch (err) {
        ws.send(
          JSON.stringify({ error: "Authentication failed", details: err }),
        );
        return;
      }

      // Command Router
      switch (command) {
        case "connect":
          handleUserConnection(userId, userName, ws, users);
          break;
        case "joinRoom":
          handleJoinRoom(userId, roomId, ws, users, rooms);
          break;
        case "leaveRoom":
          handleLeaveRoom(userId, roomId, ws, users, rooms);
          break;
        case "message":
          await handleMessage(userId, roomId, msg, users, rooms);
          break;
        default:
          ws.send(JSON.stringify({ error: "Invalid command" }));
      }
    } catch (parseError) {
      ws.send(JSON.stringify({ error: "Malformed JSON message string" }));
    }
  });
}

// --- Internal Helper Utilities ---

function handleUserConnection(
  userId: string,
  userName: string,
  ws: WebSocket,
  users: User[],
): void {
  const existingUser = users.find((user) => user.id === userId);

  if (existingUser) {
    existingUser.ws = ws;
    ws.send(JSON.stringify({ message: `Welcome back, ${userName}!` }));
    console.log(`User ${userName} (${userId}) reconnected`);
  } else {
    const newUser = createUser(userId, userName, ws);
    users.push(newUser);
    console.log(
      `User ${userName} (${userId}) connected. Total online: ${users.length}`,
    );
    ws.send(
      JSON.stringify({ message: `User ${userName} connected successfully` }),
    );
  }
}

function handleJoinRoom(
  userId: string,
  roomId: string,
  ws: WebSocket,
  users: User[],
  rooms: Room[],
): void {
  const user = users.find((u) => u.id === userId);
  if (!user) {
    ws.send(JSON.stringify({ error: "User not found. Please connect first." }));
    return;
  }

  let room = rooms.find((r) => r.id === roomId);

  if (!room) {
    console.log(`Creating new room: ${roomId}`);
    room = createRoom(roomId, `Room-${roomId}`, []);
    rooms.push(room);

    joinRoom(user, roomId);
    addUserToRoom(room, user);
    ws.send(JSON.stringify({ message: `Created and joined room ${roomId}` }));
  } else {
    joinRoom(user, roomId);
    addUserToRoom(room, user);
    ws.send(
      JSON.stringify({ message: `User ${user.name} joined room ${room.name}` }),
    );
    broadcastMessage(room, `User ${user.name} joined room`, userId);
  }
}

function handleLeaveRoom(
  userId: string,
  roomId: string,
  ws: WebSocket,
  users: User[],
  rooms: Room[],
): void {
  const user = users.find((u) => u.id === userId);
  const room = rooms.find((r) => r.id === roomId);

  if (user && room) {
    leaveRoom(user, roomId);
    removeUserFromRoom(room, userId);
    ws.send(
      JSON.stringify({ message: `User ${user.name} left room ${room.name}` }),
    );
    broadcastMessage(room, `User ${user.name} left room`, userId);
  } else {
    ws.send(
      JSON.stringify({ error: "Cannot leave room: user or room not found" }),
    );
  }
}

async function handleMessage(
  userId: string,
  roomId: string,
  msg: string,
  users: User[],
  rooms: Room[],
): Promise<void> {
  const user = users.find((u) => u.id === userId);
  const room = rooms.find((r) => r.id === roomId);

  if (!user) return;

  if (!room) {
    user.ws.send(JSON.stringify({ error: `Room ${roomId} not found` }));
    return;
  }

  try {
    const savedMessage = await prisma.messages.create({
      data: {
        roomId: roomId,
        content: msg,
        senderId: userId,
      },
    });

    // Broadcast message to all OTHER users in the room
    broadcastMessage(room, msg, userId);

    // Send confirmation to sender
    user.ws.send(
      JSON.stringify({
        type: "message_sent",
        messageId: savedMessage.id,
        status: "delivered",
        time: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Error saving message:", error);
    user.ws.send(
      JSON.stringify({
        type: "error",
        message: "Error saving message to database",
      }),
    );
  }
}
