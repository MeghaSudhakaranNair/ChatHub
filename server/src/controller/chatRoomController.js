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

    // Fetch rooms this user belongs to from the DB
    // Assuming your Prisma schema has a many-to-many relation with a userRooms or users field on chatRoom
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

// export async function postMessage(req, res) {
//   try {
//     const roomId = parseInt(req.params.roomId);
//     const userId = req.user.id;
//     const { content } = req.body;

//     const message = await prisma.message.create({
//       data: { roomId, userId, content },
//     });

//     // Here you could emit socket.io event to room channel to notify users

//     res.status(201).json(message);
//   } catch (error) {
//     res.status(500).json({ error: "Server error" });
//   }
// }

export async function postMessage(req, res) {
  try {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user.id;
    const { content } = req.body;

    const message = await prisma.message.create({
      data: { roomId, userId, content },
      include: { user: true }, // include user for frontend
    });

    // Get the io instance from Express app and emit event
    const io = req.app.get("io");
    io.to(`room_${roomId}`).emit("newMessage", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
