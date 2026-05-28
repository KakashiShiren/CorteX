import { z } from "zod";
import { statusDurationValues } from "@/lib/constants";
import { TEST_ACCOUNT_PASSWORD, usesFixedTestAccountPassword } from "@/lib/test-accounts";
import { isAllowedUniversityEmail, UNIVERSITY_EMAIL_ERROR } from "@/lib/university";

const statusDurationSet = new Set<number>(statusDurationValues);
const universityEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase())
  .refine((value) => isAllowedUniversityEmail(value), {
    message: UNIVERSITY_EMAIL_ERROR
  });

export const signUpSchema = z
  .object({
    email: universityEmailSchema,
    name: z.string().min(2, "Name is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
    clarkId: z.string().optional()
  })
  .refine(
    (data) => !usesFixedTestAccountPassword(data.email) || data.password === TEST_ACCOUNT_PASSWORD,
    {
      message: `Test accounts must use ${TEST_ACCOUNT_PASSWORD}`,
      path: ["password"]
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
  });

export const signInSchema = z.object({
  email: universityEmailSchema,
  password: z.string().min(8),
  rememberMe: z.boolean().default(true)
});

export const emailVerificationSchema = z.object({
  email: universityEmailSchema
});

export const profileSchema = z.object({
  name: z.string().min(2),
  major: z.string().min(2),
  year: z.string().min(2),
  residence: z.string().min(2),
  bio: z.string().max(220),
  interests: z.array(z.string()).default([])
});

export const statusSchema = z.object({
  activity: z.string().min(2),
  location: z.string().max(100).optional().or(z.literal("")),
  customText: z.string().max(140).optional().or(z.literal("")),
  durationMinutes: z
    .number()
    .int()
    .refine((value) => statusDurationSet.has(value), "Choose a valid status duration")
});

export const aiChatSchema = z.object({
  message: z.string().min(2, "Ask a fuller question"),
  conversationId: z.string().optional()
});
