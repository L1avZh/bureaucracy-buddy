import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateProcess, useProcesses } from "@/features/processes/hooks";
import * as processesApi from "@/api/processes";
import type { Paginated, Process } from "@/types/domain";

vi.mock("@/api/processes");

const mockProcess: Process = {
  id: "p1",
  user_id: "u1",
  title: "Renew passport",
  category: "government",
  description: null,
  status: "in_progress",
  priority: "medium",
  deadline: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  completed_at: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("processes hooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("useProcesses returns the paginated list from the API client", async () => {
    const page: Paginated<Process> = { items: [mockProcess], total: 1, page: 1, page_size: 20 };
    vi.mocked(processesApi.listProcesses).mockResolvedValue(page);

    const { result } = renderHook(() => useProcesses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(page);
    expect(processesApi.listProcesses).toHaveBeenCalledWith({});
  });

  it("surfaces an error state when the API call fails", async () => {
    vi.mocked(processesApi.listProcesses).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useProcesses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("useCreateProcess calls the API with the submitted values", async () => {
    vi.mocked(processesApi.createProcess).mockResolvedValue(mockProcess);

    const { result } = renderHook(() => useCreateProcess(), { wrapper: createWrapper() });
    result.current.mutate({ title: "Renew passport", category: "government", priority: "medium" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(processesApi.createProcess).toHaveBeenCalledWith({
      title: "Renew passport",
      category: "government",
      priority: "medium",
    });
  });
});
