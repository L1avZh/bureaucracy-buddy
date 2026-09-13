import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginFormValues, RegisterFormValues, UpdateMeValues } from "@/schemas/auth";

export const meQueryKey = ["auth", "me"] as const;

export function useMe(enabled = true) {
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      const user = await authApi.getMe();
      setSession(user, accessToken ?? "");
      return user;
    },
    enabled: enabled && Boolean(accessToken),
    retry: false,
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginFormValues) => authApi.login(values),
    onSuccess: (data) => {
      setSession(data.user, data.access_token);
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: RegisterFormValues) => authApi.register(values),
    onSuccess: (data) => {
      setSession(data.user, data.access_token);
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMutation({
    mutationFn: (values: UpdateMeValues) => authApi.updateMe(values),
    onSuccess: (user) => {
      setSession(user, accessToken ?? "");
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}
