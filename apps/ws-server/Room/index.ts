import { type User } from "../User/index";

export interface Room {
  id: string;
  name?: string;
  users: User[];
  messages: any[];
}
