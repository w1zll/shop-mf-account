import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountUser } from "./account-types";

function createUser(overrides: Partial<AccountUser> = {}): AccountUser {
  return {
    avatarUrl: null,
    bonusBalanceCents: 12_500,
    email: "demo@example.com",
    id: "user-1",
    name: "Demo User",
    role: "USER",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("account events", () => {
  it("notifies auth and account listeners with user payloads", async () => {
    const { notifyAccountChanged, notifyAuthChanged } = await import("./account-events");
    const authListener = vi.fn();
    const accountListener = vi.fn();
    const user = createUser();

    window.addEventListener("shop:auth-changed", authListener);
    window.addEventListener("shop:account-changed", accountListener);

    notifyAuthChanged(user);
    notifyAccountChanged(user);

    window.removeEventListener("shop:auth-changed", authListener);
    window.removeEventListener("shop:account-changed", accountListener);

    expect(authListener).toHaveBeenCalledTimes(1);
    expect(accountListener).toHaveBeenCalledTimes(1);
    expect((authListener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      isAuthenticated: true,
      userId: "user-1",
    });
    expect((accountListener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      email: "demo@example.com",
      name: "Demo User",
      userId: "user-1",
    });
  });

  it("notifies logout as anonymous auth and account payloads", async () => {
    const { notifyAccountChanged, notifyAuthChanged } = await import("./account-events");
    const authListener = vi.fn();
    const accountListener = vi.fn();

    window.addEventListener("shop:auth-changed", authListener);
    window.addEventListener("shop:account-changed", accountListener);

    notifyAuthChanged(null);
    notifyAccountChanged(null);

    window.removeEventListener("shop:auth-changed", authListener);
    window.removeEventListener("shop:account-changed", accountListener);

    expect((authListener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      isAuthenticated: false,
      userId: null,
    });
    expect((accountListener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      email: undefined,
      name: null,
      userId: null,
    });
  });

  it("notifies favorites changes", async () => {
    const { notifyFavoritesChanged } = await import("./account-events");
    const listener = vi.fn();

    window.addEventListener("shop:favorites-changed", listener);

    notifyFavoritesChanged("product-1", true);
    notifyFavoritesChanged("product-1", false);

    window.removeEventListener("shop:favorites-changed", listener);

    expect(listener).toHaveBeenCalledTimes(2);
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      isFavorite: true,
      productId: "product-1",
    });
    expect((listener.mock.calls[1]?.[0] as CustomEvent).detail).toEqual({
      isFavorite: false,
      productId: "product-1",
    });
  });
});
