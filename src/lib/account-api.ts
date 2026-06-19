import { AuthResponse, FavoritesResponse, OrdersResponse } from "./account-types";

const API_BASE_URL = "/api/v1";
const unsafeMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

let csrfToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Не удалось получить CSRF-токен");
  }

  const body = (await response.json()) as { csrfToken?: string };

  if (!body.csrfToken) {
    throw new Error("API вернул пустой CSRF-токен");
  }

  csrfToken = body.csrfToken;
  return csrfToken;
}

async function refreshAccessToken() {
  refreshPromise ??= (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      credentials: "include",
      headers: {
        "X-CSRF-Token": await ensureCsrfToken(),
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new ApiError("Не удалось обновить сессию", response.status);
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function sendApiRequest(path: string, init: RequestInit) {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (unsafeMethods.has(method.toUpperCase())) {
    headers.set("X-CSRF-Token", await ensureCsrfToken());
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
    method,
  });
}

async function readApiError(response: Response) {
  const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
  return new ApiError(
    errorBody?.message ?? `Account API вернул HTTP ${String(response.status)}`,
    response.status,
  );
}

async function requestApi<TResponse>(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
) {
  const response = await sendApiRequest(path, init);

  if (response.status === 401 && retryOnUnauthorized && !path.startsWith("/auth/")) {
    try {
      await refreshAccessToken();
      return await requestApi<TResponse>(path, init, false);
    } catch {
      throw await readApiError(response);
    }
  }

  if (!response.ok) {
    throw await readApiError(response);
  }

  return (await response.json()) as TResponse;
}

export function login(payload: { email: string; password: string }) {
  return requestApi<AuthResponse>("/auth/login", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function register(payload: { email: string; name: string; password: string }) {
  return requestApi<AuthResponse>("/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function logout() {
  return requestApi<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return requestApi<AuthResponse>("/users/me");
}

export function updateMe(payload: { avatarUrl?: string; name?: string }) {
  return requestApi<AuthResponse>("/users/me", {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function getFavorites() {
  return requestApi<FavoritesResponse>("/favorites");
}

export function addFavorite(productId: string) {
  return requestApi<unknown>(`/favorites/${productId}`, {
    method: "POST",
  });
}

export function removeFavorite(productId: string) {
  return requestApi<{ ok: boolean }>(`/favorites/${productId}`, {
    method: "DELETE",
  });
}

export function getOrders(page = 1, limit = 20) {
  return requestApi<OrdersResponse>(`/orders?page=${String(page)}&limit=${String(limit)}`);
}
