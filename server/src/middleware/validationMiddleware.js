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
