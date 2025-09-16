/**
 * Middleware factory for validating HTTP request bodies against a Zod schema.
 *
 * @param {ZodSchema} schema - The Zod schema object defining validation rules for the request body.
 * @returns {Function} Express middleware function that parses and validates the request body.
 *
 * The middleware attempts to parse and validate the incoming request body with the given schema.
 * - If validation succeeds, it calls `next()` to pass control to the next middleware or route handler.
 * - If validation fails with Zod-specific errors, it responds with HTTP 400 Bad Request and the validation error details.
 * - If an unexpected error occurs, it responds with HTTP 500 Internal Server Error.
 *
 * This middleware enforces input data integrity, preventing invalid payloads from reaching business logic,
 * and provides standardized validation error responses.
 */
import { z } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(error.errors);
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
