import { beforeEach, describe, expect, it } from "vitest";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/domain";

const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  display_name: "Test User",
  locale: "en",
  theme: "system",
  created_at: "2024-01-01T00:00:00Z",
};

describe("auth-store", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isInitializing: true });
  });

  it("starts with no session and isInitializing true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isInitializing).toBe(true);
  });

  it("setSession stores the user and token, and clears isInitializing", () => {
    useAuthStore.getState().setSession(mockUser, "token-abc");

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(getAccessToken()).toBe("token-abc");
    expect(useAuthStore.getState().isInitializing).toBe(false);
  });

  it("setAccessToken updates only the token", () => {
    useAuthStore.getState().setSession(mockUser, "token-abc");
    useAuthStore.getState().setAccessToken("token-refreshed");

    expect(getAccessToken()).toBe("token-refreshed");
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("clear resets user and token", () => {
    useAuthStore.getState().setSession(mockUser, "token-abc");
    useAuthStore.getState().clear();

    expect(useAuthStore.getState().user).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(useAuthStore.getState().isInitializing).toBe(false);
  });
});
