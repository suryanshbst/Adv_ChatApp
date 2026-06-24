import { type WebSocket } from "ws";

// Define the User structural type
export interface User {
  id: string;
  name: string;
  ws: WebSocket;
  rooms: string[];
}

// Factory function to create a new user object
export function createUser(id: string, name: string, ws: WebSocket): User {
  return {
    id,
    name,
    ws,
    rooms: [],
  };
}

// Utility functions to manage state
export function joinRoom(user: User, roomId: string): void {
  if (!user.rooms.includes(roomId)) {
    user.rooms.push(roomId);
  } else {
    user.ws.send(JSON.stringify({ error: "User already in room" }));
  }
}

export function leaveRoom(user: User, roomId: string): void {
  user.rooms = user.rooms.filter((room) => room !== roomId);
}

export function createRoom(user: User, roomId: string): void {
  user.rooms.push(roomId);
}
