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
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Initialize LLM and LangChain components once, outside the handler
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

const promptTemplate = PromptTemplate.fromTemplate(
  `The following is a friendly conversation between a human and an AI. The AI is named Assistant.
  Current conversation:
  {history}
  Human: {input}
  Assistant:`
);
const chain = RunnableSequence.from([promptTemplate, model]);
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
    const io = req.app.get("io");

    const message = await prisma.message.create({
      data: { roomId, userId, content },
      include: { user: true },
    });

    io.to(`room_${roomId}`).emit("newMessage", message);

    if (content.startsWith("@assistant")) {
      const query = content.substring("@assistant".length).trim();

      // Check for an empty query
      if (query.length === 0) {
        const assistantMessage = await prisma.message.create({
          data: {
            roomId,
            userId: 4, // Use a special user ID for the assistant
            content: "Hey, I'm here to help! What can I do for you?",
          },
          include: { user: true },
        });
        io.to(`room_${roomId}`).emit("newMessage", assistantMessage);
        return res.status(201).json(userMessage);
      }

      // Load previous messages from the database
      const existingMessages = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "asc" },
        take: 10, // Limit history to the last 10 messages
      });

      // Format messages for the prompt
      const formattedHistory = existingMessages
        .map((msg) => `${msg.userId ? "Human" : "Assistant"}: ${msg.content}`)
        .join("\n");

      try {
        // Generate AI response
        const aiResponse = await chain.invoke({
          history: formattedHistory,
          input: query,
        });

        // Save the AI's response to the database
        const assistantMessage = await prisma.message.create({
          data: {
            roomId,
            userId: 4, // A special or dedicated ID for the assistant
            content: aiResponse.content,
          },
          include: { user: true },
        });

        // Broadcast the AI's response to the room
        io.to(`room_${roomId}`).emit("newMessage", assistantMessage);
      } catch (error) {
        console.error("Error generating AI response:", error);
        // const errorMessage = await prisma.message.create({
        //   data: {
        //     roomId,
        //     userId: null,
        //     content:
        //       "Sorry, I'm having trouble thinking right now. Please try again later.",
        //   },
        //   include: { user: true },
        // });
        io.to(`room_${roomId}`).emit("newMessage", errorMessage);
      }
    }
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
