/**
 * This module handles user authentication using Google OAuth integrated with Prisma ORM.
 *
 * - It defines a function to retrieve user profile information from Google's OAuth API using the access token.
 * - The main handler, `googleAuth`, verifies the Google token, fetches user info, and checks for an existing user in the database.
 * - If the user does not exist, it creates a new user record; otherwise, it updates their profile data.
 * - Generates a JWT token for session management and sets it as an HTTP-only cookie.
 * - Provides an endpoint `getUserDetails` to retrieve authenticated user details from the database based on the user ID from the request.
 * - Defines a `handleLogout` function to clear the authentication cookie, effectively logging out the user.
 *
 * Error handling is implemented with try-catch blocks and appropriate HTTP status codes, ensuring robust API responses.
 *
 * This architecture supports secure OAuth login, user creation or update, and stateful session handling for web clients.
 */
import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import { generateToken } from "../utils/authUtils.js";

const prisma = new PrismaClient();
const getUserInfoFromAccessToken = async (accessToken) => {
  const response = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response.data;
};
export const googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const userInfo = await getUserInfoFromAccessToken(token);

    const { email, name, picture } = userInfo;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          photoUrl: picture,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          photoUrl: picture,
        },
      });
    }

    const jwtToken = generateToken(user.id);
    res.cookie("token", jwtToken, {
      httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Authentication successful",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    console.log("user", req.user);
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const handleLogout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production", // uncomment if https
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
