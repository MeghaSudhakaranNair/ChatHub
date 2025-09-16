import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
});

export const joinRoomSchema = z.object({
  userId: z.number().int(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});
