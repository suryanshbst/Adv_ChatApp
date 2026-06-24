import { WebSocketServer, type WebSocket } from "ws";
import { type User } from "./User/index";
import { type Room } from "./Room/index";
import { handleConnection } from "./Connection/index";

const users: User[] = [];
const rooms: Room[] = [];

const port = Number(process.env.PORT) || 3000;
const wss = new WebSocketServer({ port });

wss.on("connection", (ws: WebSocket) => {
  handleConnection(ws, users, rooms);
});

console.log(`Server started on port ${port}`);
