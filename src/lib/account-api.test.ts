import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthResponse, OrdersResponse } from "./account-types";

function createFetchMock() {
  return vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
}

function createResponse(body: unknown, status = 200) {
  return {
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

function createAuthResponse(overrides: Partial<AuthResponse["user"]> = {}): AuthResponse {
  return {
    user: {
      avatarUrl: null,
      bonusBalanceCents: 12_500,
      email: "demo@example.com",
      id: "user-1",
      name: "Demo User",
      role: "USER",
      ...overrides,
    },
  };
}

function createOrdersResponse(): OrdersResponse {
  return {
    items: [],
    pagination: {
      limit: 20,
      page: 2,
      total: 0,
      totalPages: 0,
    },
  };
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
}

function getHeader(init: RequestInit | undefined, name: string) {
  return new Headers(init?.headers).get(name);
}

function getFetchCall(fetchMock: ReturnType<typeof createFetchMock>, index: number) {
  const call = fetchMock.mock.calls[index];

  if (!call) {
    throw new Error(`Expected fetch call at index ${String(index)}`);
  }

  return call;
}

afterEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("account API client", () => {
  it("adds CSRF and JSON headers for register requests", async () => {
    const fetchMock = createFetchMock();
    fetchMock
      .mockResolvedValueOnce(createResponse({ csrfToken: "csrf-token" }))
      .mockResolvedValueOnce(createResponse(createAuthResponse(), 201));
    vi.stubGlobal("fetch", fetchMock);

    const { register } = await import("./account-api");

    await register({
      email: "demo@example.com",
      name: "Demo User",
      password: "password123",
    });

    const csrfCall = getFetchCall(fetchMock, 0);
    const registerCall = getFetchCall(fetchMock, 1);
    const [, registerInit] = registerCall;

    expect(getRequestUrl(csrfCall[0])).toBe("/api/v1/auth/csrf");
    expect(csrfCall[1]).toEqual(expect.objectContaining({ credentials: "include" }));
    expect(getRequestUrl(registerCall[0])).toBe("/api/v1/auth/register");
    expect(registerInit).toEqual(
      expect.objectContaining({
        body: JSON.stringify({
          email: "demo@example.com",
          name: "Demo User",
          password: "password123",
        }),
        credentials: "include",
        method: "POST",
      }),
    );
    expect(getHeader(registerInit, "Content-Type")).toBe("application/json");
    expect(getHeader(registerInit, "X-CSRF-Token")).toBe("csrf-token");
  });

  it("refreshes access token once and retries unauthorized profile requests", async () => {
    const fetchMock = createFetchMock();
    fetchMock
      .mockResolvedValueOnce(createResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(createResponse({ csrfToken: "csrf-token" }))
      .mockResolvedValueOnce(createResponse({ ok: true }))
      .mockResolvedValueOnce(createResponse(createAuthResponse({ name: "Refreshed User" })));
    vi.stubGlobal("fetch", fetchMock);

    const { getMe } = await import("./account-api");

    await expect(getMe()).resolves.toMatchObject({
      user: {
        name: "Refreshed User",
      },
    });

    const requestedUrls = fetchMock.mock.calls.map(([input]) => getRequestUrl(input));
    const [, refreshInit] = getFetchCall(fetchMock, 2);

    expect(requestedUrls).toEqual([
      "/api/v1/users/me",
      "/api/v1/auth/csrf",
      "/api/v1/auth/refresh",
      "/api/v1/users/me",
    ]);
    expect(refreshInit).toEqual(
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    expect(getHeader(refreshInit, "X-CSRF-Token")).toBe("csrf-token");
  });

  it("builds paginated order requests", async () => {
    const fetchMock = createFetchMock();
    fetchMock.mockResolvedValueOnce(createResponse(createOrdersResponse()));
    vi.stubGlobal("fetch", fetchMock);

    const { getOrders } = await import("./account-api");

    await expect(getOrders(2, 10)).resolves.toMatchObject({
      pagination: {
        limit: 20,
        page: 2,
      },
    });

    expect(getRequestUrl(getFetchCall(fetchMock, 0)[0])).toBe("/api/v1/orders?page=2&limit=10");
  });
});
