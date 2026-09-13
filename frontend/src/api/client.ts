import type { z } from "zod";
import { apiErrorSchema } from "@/schemas/common";
import { refreshResponseSchema } from "@/schemas/auth";
import { getAccessToken, useAuthStore } from "@/stores/auth-store";

/**
 * Base path for all API calls. In dev, Vite proxies `/api` to the FastAPI
 * backend (see vite.config.ts) so no CORS setup is needed locally. In
 * production you can point at a separate origin via VITE_API_URL, or leave
 * it unset to call same-origin `/api` (e.g. when the backend serves the
 * built frontend, or sits behind the same reverse proxy).
 */
const API_BASE = import.meta.env.VITE_API_URL ?? "";
const API_V1 = `${API_BASE}/api/v1`;

export class ApiError extends Error {
  code: string;
  details: unknown[];
  status: number;

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ContractMismatchError extends Error {
  constructor(path: string, issues: unknown) {
    super(
      `Response from ${path} did not match the expected schema. This usually means the backend ` +
        `response shape drifted from the zod schema in src/schemas/. See console for zod issues.`,
    );
    this.name = "ContractMismatchError";
    console.error(`[ContractMismatchError] ${path}`, issues);
  }
}

let refreshPromise: Promise<string | null> | null = null;
let onAuthExpired: (() => void) | null = null;

/** Wired up once from app bootstrap so the client can redirect to /login. */
export function setOnAuthExpired(handler: () => void): void {
  onAuthExpired = handler;
}

async function attemptRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_V1}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return null;
        const body: unknown = await res.json();
        const parsed = refreshResponseSchema.safeParse(body);
        if (!parsed.success) return null;
        useAuthStore.getState().setAccessToken(parsed.data.access_token);
        return parsed.data.access_token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface RequestOptions<TResponse> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Pass a FormData body for multipart uploads (skips JSON stringify + content-type). */
  formData?: FormData;
  schema?: z.ZodType<TResponse>;
  /** Skip the Authorization header and 401-refresh dance (login/register/health). */
  skipAuth?: boolean;
  signal?: AbortSignal;
}

async function parseErrorBody(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return new ApiError(res.status, "INTERNAL_ERROR", "Unexpected server response.");
  }
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) {
    return new ApiError(res.status, parsed.data.error.code, parsed.data.error.message, parsed.data.error.details);
  }
  return new ApiError(res.status, "INTERNAL_ERROR", "Unexpected server response.");
}

async function doFetch<TResponse>(
  path: string,
  options: RequestOptions<TResponse>,
  isRetry: boolean,
): Promise<{ res: Response; raw: unknown }> {
  const headers: Record<string, string> = {};
  if (!options.formData) headers["Content-Type"] = "application/json";
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_V1}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    signal: options.signal,
  });

  if (res.status === 401 && !options.skipAuth && !isRetry) {
    const newToken = await attemptRefresh();
    if (newToken) {
      return doFetch(path, options, true);
    }
    useAuthStore.getState().clear();
    onAuthExpired?.();
    throw new ApiError(401, "UNAUTHORIZED", "Your session expired. Please sign in again.");
  }

  if (res.status === 204) {
    return { res, raw: undefined };
  }

  const raw: unknown = await res.json().catch(() => undefined);
  return { res, raw };
}

export async function apiRequest<TResponse>(path: string, options: RequestOptions<TResponse> = {}): Promise<TResponse> {
  const { res, raw } = await doFetch(path, options, false);

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(raw);
    if (parsed.success) {
      throw new ApiError(res.status, parsed.data.error.code, parsed.data.error.message, parsed.data.error.details);
    }
    throw new ApiError(res.status, "INTERNAL_ERROR", "Unexpected server response.");
  }

  if (options.schema && import.meta.env.DEV) {
    const parsed = options.schema.safeParse(raw);
    if (!parsed.success) {
      throw new ContractMismatchError(path, parsed.error.issues);
    }
    return parsed.data;
  }

  return raw as TResponse;
}

/** Fetches a raw binary response (e.g. document download) with auth headers, no JSON parsing. */
export async function apiRequestBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_V1}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    throw await parseErrorBody(res);
  }
  return res.blob();
}
