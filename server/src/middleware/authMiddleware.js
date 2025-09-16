/**
 * Middleware function to protect API routes by verifying JSON Web Tokens (JWT).
 *
 * - Extracts the JWT token from the "Authorization" header (Bearer token) or from an HTTP-only cookie.
 * - If no token is found, responds with a 401 Unauthorized status.
 * - Verifies the token using the server's JWT secret environment variable.
 * - On successful verification, retrieves the corresponding user from the database using Prisma ORM.
 * - Attaches the user object (with minimal fields: id and email) to the request object for downstream handlers.
 * - Calls `next()` to pass control to the next middleware or route handler if token is valid.
 * - Returns 401 Unauthorized with error message if verification fails or token is invalid.
 *
 * This middleware enforces secure access control by validating the authenticity and integrity of JWTs,
 * ensuring only authenticated users can access protected resources and APIs.
 */
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true },
    });

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
