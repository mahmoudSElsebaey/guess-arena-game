import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  ABLY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional()
});

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}
