/**
 * REST API handlers for chat room and message management using Prisma ORM.
 *
 * - getRooms: Fetches and returns all chat rooms in the database.
 * - getUserRooms: Retrieves chat rooms that the authenticated user is a member of, including room details.
 * - createRoom: Creates a new chat room with the provided name and adds the creator as a member using a transaction.
 * - joinRoom: Allows a user to join an existing chat room, ensuring unique membership via an upsert.
 * - getRoomUsers: Fetches the list of users currently joined to a specific chat room.
 * - getMessages: Retrieves all chat messages for a particular room, ordered by creation time ascending.
 * - postMessage: Posts a new message to a chat room and emits the message to all clients connected via Socket.IO in real-time.
 *
 * Each function handles success by sending appropriate JSON data and HTTP status codes.
 * Errors are caught globally and responded with a 500 status code and generic server error message.
 *
 * This API layer provides the core backend functionality to manage chat rooms, memberships,
 * messaging, and synchronization with real-time socket events, enabling a full-featured chat system.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function getRooms(req, res) {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

export const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRooms = await prisma.userOnRoom.findMany({
      where: {
        userId: userId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Fetched chat rooms for user", data: userRooms });
  } catch (error) {
    console.error("Error fetching user's chat rooms:", error);
    res.status(500).json({
      message: "Failed to retrieve chat rooms for user",
    });
  }
};

export async function createRoom(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    console.log(name);
    const roomWithMember = await prisma.$transaction(async (tx) => {
      const roomCreated = await tx.room.create({ data: { name } });
      await tx.userOnRoom.create({
        data: {
          userId,
          roomId: roomCreated.id,
        },
      });
      return roomCreated;
    });

    res.status(201).json(roomWithMember);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function joinRoom(req, res) {
  try {
    const userId = req.user.id;

    const roomId = parseInt(req.params.roomId);
    console.log("data", roomId, userId);
    const membership = await prisma.userOnRoom.upsert({
      where: { userId_roomId: { userId, roomId } },
      update: {},
      create: { userId, roomId },
    });

    res.status(200).json(membership);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function getRoomUsers(req, res) {
  try {
    const roomId = parseInt(req.params.roomId);
    const users = await prisma.userOnRoom.findMany({
      where: { roomId },
      include: { user: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function getMessages(req, res) {
  try {
    const roomId = parseInt(req.params.roomId);
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}

export async function postMessage(req, res) {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user.id;
    const { content } = req.body;

    const message = await prisma.message.create({
      data: { roomId, userId, content },
      include: { user: true },
    });

    const io = req.app.get("io");
    io.to(`room_${roomId}`).emit("newMessage", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
