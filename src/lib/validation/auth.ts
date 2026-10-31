import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(32),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(64)
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(64)
});

export type RegisterInput = z.infer<typeof registerSchema>;
