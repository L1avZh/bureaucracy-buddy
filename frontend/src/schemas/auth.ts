import { z } from "zod";
import type { Locale, ThemePreference, User } from "@/types/domain";

export const localeSchema: z.ZodType<Locale> = z.enum(["en", "he"]);
export const themePreferenceSchema: z.ZodType<ThemePreference> = z.enum(["light", "dark", "system"]);

export const userSchema: z.ZodType<User> = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string(),
  locale: localeSchema,
  theme: themePreferenceSchema,
  created_at: z.string(),
});

export const authResponseSchema = z.object({
  user: userSchema,
  access_token: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const refreshResponseSchema = z.object({
  access_token: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

// --- form / request schemas ---

export const registerFormSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
  password: z.string().min(10, "auth.errors.passwordTooShort"),
  display_name: z.string().min(1, "auth.errors.displayNameRequired"),
});
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
  password: z.string().min(1, "auth.errors.passwordRequired"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const updateMeSchema = z.object({
  display_name: z.string().min(1).optional(),
  locale: localeSchema.optional(),
  theme: themePreferenceSchema.optional(),
});
export type UpdateMeValues = z.infer<typeof updateMeSchema>;
