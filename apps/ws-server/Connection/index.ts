import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db/prisma"; // ← ADD THIS
import { type User } from "../User/index";
import { type Room } from "../Room/index";

const JWT_SECRET = process.env.JWT_SECRET;

export function handleConnection(ws: WebSocket, users: User[], rooms: Room[]) {
  let currentUser: User | null = null;
  let currentRoom: Room | null = null;

  ws.on("message", async (data: string) => {
    // ← ADD async
    try {
      const message = JSON.parse(data.toString());

      switch (message.command) {
        case "connect": {
          const token = message.token;
          if (!token || !JWT_SECRET) {
            ws.send(JSON.stringify({ error: "Invalid token" }));
            return;
          }

          try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
              id: string;
              email: string;
            };

            currentUser = {
              id: decoded.id,
              name: message.userName || decoded.email,
              ws,
            };

            users.push(currentUser);

            ws.send(
              JSON.stringify({
                type: "connected",
                userId: currentUser.id,
                message: "Connected successfully",
              }),
            );
          } catch (err) {
            ws.send(JSON.stringify({ error: "Invalid token" }));
          }
          break;
        }

        case "joinRoom": {
          if (!currentUser) {
            ws.send(JSON.stringify({ error: "Not connected" }));
            return;
          }

          const roomId = message.roomId;
          let room = rooms.find((r) => r.id === roomId);

          if (!room) {
            room = {
              id: roomId,
              users: [],
              messages: [],
            };
            rooms.push(room);
          }

          if (!room.users.find((u) => u.id === currentUser!.id)) {
            room.users.push(currentUser);
          }

          currentRoom = room;

          // Notify others
          room.users.forEach((user) => {
            if (
              user.id !== currentUser!.id &&
              user.ws.readyState === WebSocket.OPEN
            ) {
              user.ws.send(
                JSON.stringify({
                  type: "user_joined",
                  from: "System",
                  message: `${currentUser!.name} joined the room`,
                  time: new Date().toLocaleTimeString(),
                }),
              );
            }
          });

          // Fetch last 50 messages from DATABASE
          let last50Messages = [];
          try {
            const dbMessages = await prisma.messages.findMany({
              where: { roomId: roomId },
              orderBy: { createdAt: "desc" },
              take: 50,
            });

            last50Messages = dbMessages.reverse().map((m) => ({
              id: m.id,
              message: m.content,
              from: m.senderId === currentUser!.id ? currentUser!.name : "User",
              senderId: m.senderId,
              time: new Date(m.createdAt).toLocaleTimeString(),
            }));
          } catch (err) {
            console.error("Failed to fetch messages from DB:", err);
            last50Messages = room.messages.slice(-50);
          }

          ws.send(
            JSON.stringify({
              type: "room_joined",
              roomId: room.id,
              roomName: room.name || `Room-${room.id}`,
              users: room.users.map((u) => ({ id: u.id, name: u.name })),
              messages: last50Messages,
            }),
          );
          break;
        }

        case "message": {
          if (!currentUser || !currentRoom) {
            ws.send(JSON.stringify({ error: "Not in a room" }));
            return;
          }

          const msgContent = message.msg || message.message;
          if (!msgContent || !msgContent.trim()) return;

          const msgId = Math.random().toString(36).substring(2, 9);
          const newMessage = {
            id: msgId,
            message: msgContent.trim(),
            from: currentUser.name,
            senderId: currentUser.id,
            time: new Date().toLocaleTimeString(),
          };

          // Save to database
          try {
            await prisma.messages.create({
              data: {
                id: msgId,
                content: msgContent.trim(),
                senderId: currentUser.id,
                roomId: currentRoom.id,
              },
            });
          } catch (err) {
            console.error("Failed to save message to DB:", err);
          }

          currentRoom.messages.push(newMessage);

          // Keep only last 50 in memory
          if (currentRoom.messages.length > 50) {
            currentRoom.messages = currentRoom.messages.slice(-50);
          }

          // Broadcast
          currentRoom.users.forEach((user) => {
            if (user.ws.readyState === WebSocket.OPEN) {
              user.ws.send(JSON.stringify(newMessage));
            }
          });
          break;
        }

        case "leaveRoom": {
          if (currentRoom && currentUser) {
            currentRoom.users = currentRoom.users.filter(
              (u) => u.id !== currentUser!.id,
            );

            currentRoom.users.forEach((user) => {
              if (user.ws.readyState === WebSocket.OPEN) {
                user.ws.send(
                  JSON.stringify({
                    type: "user_left",
                    from: "System",
                    message: `${currentUser!.name} left the room`,
                    time: new Date().toLocaleTimeString(),
                  }),
                );
              }
            });
          }
          break;
        }

        default:
          ws.send(JSON.stringify({ error: "Unknown command" }));
      }
    } catch (err) {
      console.error("WS message error:", err);
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    if (currentRoom && currentUser) {
      currentRoom.users = currentRoom.users.filter(
        (u) => u.id !== currentUser!.id,
      );

      currentRoom.users.forEach((user) => {
        if (user.ws.readyState === WebSocket.OPEN) {
          user.ws.send(
            JSON.stringify({
              type: "user_left",
              from: "System",
              message: `${currentUser!.name} left the room`,
              time: new Date().toLocaleTimeString(),
            }),
          );
        }
      });
    }

    if (currentUser) {
      const idx = users.findIndex((u) => u.id === currentUser!.id);
      if (idx !== -1) users.splice(idx, 1);
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
}
