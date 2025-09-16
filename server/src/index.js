import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import chatRoomRoutes from "./routes/chatRoomRoutes.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const usersInRoom = {};
// Middleware
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(cookieParser());
// API Routes
app.use("/chatRooms", chatRoomRoutes);
app.use("/api/auth", authRoutes);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", async (roomId, user) => {
    const roomName = `room_${roomId}`;
    socket.join(roomName);
    socket.data.user = user; // Store user info on socket
    console.log(`User ${socket.id} joined ${roomName}`);
    if (!user || !user.id) {
      return; // Don't add invalid user
    }
    if (!usersInRoom[roomName]) {
      usersInRoom[roomName] = [];
    }

    // Remove existing entry for the same user or socket
    usersInRoom[roomName] = usersInRoom[roomName].filter(
      (u) => u.socketId !== socket.id && u.id !== user.id
    );

    // Add user with socketId
    usersInRoom[roomName].push({ ...user, socketId: socket.id });

    // Emit updated online users
    io.to(roomName).emit("onlineUsers", usersInRoom[roomName]);
  });

  socket.on("leaveRoom", (roomId) => {
    const roomName = `room_${roomId}`;
    socket.leave(roomName);
    console.log(`User ${socket.id} left ${roomName}`);

    if (usersInRoom[roomName]) {
      usersInRoom[roomName] = usersInRoom[roomName].filter(
        (u) => u.socketId !== socket.id
      );
      io.to(roomName).emit("onlineUsers", usersInRoom[roomName]);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms
    for (const roomName in usersInRoom) {
      usersInRoom[roomName] = usersInRoom[roomName].filter(
        (u) => u.socketId !== socket.id
      );
      io.to(roomName).emit("onlineUsers", usersInRoom[roomName]);
    }
  });
});

// Start server after DB connection
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully!");
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
