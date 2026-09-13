import { apiRequest } from "@/api/client";
import { authResponseSchema, refreshResponseSchema, userSchema } from "@/schemas/auth";
import type { AuthResponse, RefreshResponse } from "@/schemas/auth";
import type { LoginFormValues, RegisterFormValues, UpdateMeValues } from "@/schemas/auth";
import type { User } from "@/types/domain";

export function register(values: RegisterFormValues): Promise<AuthResponse> {
  return apiRequest("/auth/register", { method: "POST", body: values, schema: authResponseSchema, skipAuth: true });
}

export function login(values: LoginFormValues): Promise<AuthResponse> {
  return apiRequest("/auth/login", { method: "POST", body: values, schema: authResponseSchema, skipAuth: true });
}

export function refresh(): Promise<RefreshResponse> {
  return apiRequest("/auth/refresh", { method: "POST", schema: refreshResponseSchema, skipAuth: true });
}

export function logout(): Promise<void> {
  return apiRequest("/auth/logout", { method: "POST", skipAuth: true });
}

export function getMe(): Promise<User> {
  return apiRequest("/users/me", { schema: userSchema });
}

export function updateMe(values: UpdateMeValues): Promise<User> {
  return apiRequest("/users/me", { method: "PATCH", body: values, schema: userSchema });
}
