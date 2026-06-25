import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { type User } from "../User/index";
import { type Room } from "../Room/index";

const JWT_SECRET = process.env.JWT_SECRET;

export function handleConnection(ws: WebSocket, users: User[], rooms: Room[]) {
  let currentUser: User | null = null;
  let currentRoom: Room | null = null;

  ws.on("message", (data: string) => {
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

          // Notify others in the room
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

          // Send room info to joining user
          ws.send(
            JSON.stringify({
              type: "room_joined",
              roomId: room.id,
              roomName: room.name || `Room-${room.id}`,
              users: room.users.map((u) => ({ id: u.id, name: u.name })),
              messages: room.messages,
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

          currentRoom.messages.push(newMessage);

          // Broadcast to all users in the room (including sender)
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

            // Notify others
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
