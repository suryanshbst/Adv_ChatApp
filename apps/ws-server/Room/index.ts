import { type User } from "../User/index";
import { WebSocket } from "ws";

// Define the Room structural type
export interface Room {
  id: string;
  name: string;
  users: User[];
}

// Factory function to create a new room object
export function createRoom(
  id: string,
  name: string,
  initialUsers: User[] = [],
): Room {
  return {
    id,
    name,
    users: initialUsers,
  };
}

// Utility functions to manage state
export function addUserToRoom(room: Room, user: User): void {
  if (!room.users.some((u) => u.id === user.id)) {
    room.users.push(user);
  }
}

export function removeUserFromRoom(room: Room, userId: string): void {
  room.users = room.users.filter((u) => u.id !== userId);
}

// Broadcast message functionality
export function broadcastMessage(
  room: Room,
  message: string,
  senderId: string,
): void {
  const sender = room.users.find((u) => u.id === senderId);
  const senderName = sender?.name || "Unknown";

  room.users.forEach((user) => {
    // Only send to other open connections
    if (user.id !== senderId && user.ws.readyState === WebSocket.OPEN) {
      try {
        user.ws.send(
          JSON.stringify({
            type: "message",
            roomId: room.id,
            message: message,
            from: senderName,
            time: new Date().toLocaleTimeString(),
          }),
        );
      } catch (err) {
        console.error(`Failed to send message to user ${user.name}:`, err);

        // Notify sender if something went wrong
        if (sender && sender.ws.readyState === WebSocket.OPEN) {
          sender.ws.send(
            JSON.stringify({
              type: "error",
              message: `Failed to reach ${user.name}`,
            }),
          );
        }
      }
    }
  });
}
