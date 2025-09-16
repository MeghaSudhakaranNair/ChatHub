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

router.use(protect);

router.get("/allRooms", getRooms);
router.post("/", validate(createRoomSchema), createRoom);
router.get("/myRooms", getUserRooms);
router.post("/:roomId/join", joinRoom);

router.get("/:roomId/users", getRoomUsers);

router.get("/:roomId/messages", getMessages);
router.post("/:roomId/messages", validate(sendMessageSchema), postMessage);

export default router;
