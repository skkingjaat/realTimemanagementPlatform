// File: src/lib/validations/auth.ts

import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(100, "Name must not exceed 100 characters."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(100, "Password must not exceed 100 characters."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;