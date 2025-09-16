import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createRoomSchema,
  joinRoomSchema,
  sendMessageSchema,
} from "../validator/chatRoomValidator.js";
import {
  createRoom,
  joinRoom,
  getRooms,
  getRoomUsers,
  getMessages,
  postMessage,
  getUserRooms,
} from "../controller/chatRoomController.js";

const router = express.Router();

router.use(protect); // Protect all chat room routes

router.get("/allRooms", getRooms); // List active chat rooms
router.post("/", validate(createRoomSchema), createRoom); // Create new chat room
router.get("/myRooms", getUserRooms);
router.post("/:roomId/join", joinRoom); // Join room

router.get("/:roomId/users", getRoomUsers); // List users in room

router.get("/:roomId/messages", getMessages); // Get message history
router.post("/:roomId/messages", validate(sendMessageSchema), postMessage); // Post new message

export default router;
