import { WebSocket } from "ws";

export interface User {
  id: string;
  name: string;
  ws: WebSocket;
}
