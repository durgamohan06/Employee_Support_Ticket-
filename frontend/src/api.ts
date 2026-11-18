async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, headers, credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ user: import("./types.ts").User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: import("./types.ts").User }>("/api/auth/me"),
  myTickets: () =>
    request<{ tickets: import("./types.ts").Ticket[]; counts: import("./types.ts").Counts }>("/api/tickets"),
  supportTickets: (query: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const suffix = params.toString() ? `?${params}` : "";
    return request<{ tickets: import("./types.ts").Ticket[]; counts: import("./types.ts").Counts }>(
      `/api/tickets/support${suffix}`,
    );
  },
  createTicket: (body: object) =>
    request<{ ticket: import("./types.ts").Ticket }>("/api/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getTicket: (id: string) => request<{ ticket: import("./types.ts").Ticket }>(`/api/tickets/${id}`),
  updateTicket: (id: string, body: object) =>
    request<{ ticket: import("./types.ts").Ticket }>(`/api/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  updateStatus: (id: string, status: string) =>
    request<{ ticket: import("./types.ts").Ticket }>(`/api/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  comments: (id: string) => request<{ comments: import("./types.ts").Comment[] }>(`/api/tickets/${id}/comments`),
  addComment: (id: string, text: string) =>
    request<{ comment: import("./types.ts").Comment; ticket: import("./types.ts").Ticket }>(
      `/api/tickets/${id}/comments`,
      { method: "POST", body: JSON.stringify({ text }) },
    ),
};
