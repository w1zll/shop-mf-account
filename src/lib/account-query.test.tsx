import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { login, logout, register, removeFavorite, updateMe } from "./account-api";
import {
  accountQueryKeys,
  AccountQueryProvider,
  resetAccountQueryClientForTests,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useRemoveFavoriteMutation,
  useUpdateProfileMutation,
} from "./account-query";
import { notifyAccountChanged, notifyAuthChanged, notifyFavoritesChanged } from "./account-events";
import { AccountUser, AuthResponse } from "./account-types";

vi.mock("./account-api", () => ({
  getFavorites: vi.fn(),
  getMe: vi.fn(),
  getOrders: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  removeFavorite: vi.fn(),
  updateMe: vi.fn(),
}));

vi.mock("./account-events", () => ({
  notifyAccountChanged: vi.fn(),
  notifyAuthChanged: vi.fn(),
  notifyFavoritesChanged: vi.fn(),
}));

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

function createAuthResponse(overrides: Partial<AccountUser> = {}): AuthResponse {
  return {
    user: createUser(overrides),
  };
}

function getCachedMe(queryClient: QueryClient) {
  return queryClient.getQueryData<AuthResponse>(accountQueryKeys.me);
}

function AccountMutationsHarness() {
  const queryClient = useQueryClient();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  const registerMutation = useRegisterMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  return (
    <div>
      <span data-testid="cached-user">{getCachedMe(queryClient)?.user.email ?? "none"}</span>
      <button
        type="button"
        onClick={() => {
          loginMutation.mutate({ email: "demo@example.com", password: "password123" });
        }}
      >
        login
      </button>
      <button
        type="button"
        onClick={() => {
          registerMutation.mutate({
            email: "new@example.com",
            name: "New User",
            password: "password123",
          });
        }}
      >
        register
      </button>
      <button
        type="button"
        onClick={() => {
          updateProfileMutation.mutate({ avatarUrl: undefined, name: "Updated User" });
        }}
      >
        update profile
      </button>
      <button
        type="button"
        onClick={() => {
          logoutMutation.mutate();
        }}
      >
        logout
      </button>
    </div>
  );
}

function FavoriteMutationHarness() {
  const removeFavoriteMutation = useRemoveFavoriteMutation();

  return (
    <button
      type="button"
      onClick={() => {
        removeFavoriteMutation.mutate("product-1");
      }}
    >
      remove favorite
    </button>
  );
}

function renderWithAccountQuery(children: React.ReactNode) {
  return render(<AccountQueryProvider>{children}</AccountQueryProvider>);
}

afterEach(() => {
  cleanup();
  resetAccountQueryClientForTests();
  vi.clearAllMocks();
});

describe("account query mutations", () => {
  it("caches current user and notifies consumers after login", async () => {
    const user = userEvent.setup();
    const response = createAuthResponse();

    vi.mocked(login).mockResolvedValue(response);

    renderWithAccountQuery(<AccountMutationsHarness />);

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("cached-user")).toHaveTextContent("demo@example.com");
    });
    expect(notifyAuthChanged).toHaveBeenCalledWith(response.user);
    expect(notifyAccountChanged).toHaveBeenCalledWith(response.user);
  });

  it("caches current user after register and profile update", async () => {
    const user = userEvent.setup();
    const registerResponse = createAuthResponse({
      email: "new@example.com",
      id: "user-2",
      name: "New User",
    });
    const updateResponse = createAuthResponse({
      email: "new@example.com",
      id: "user-2",
      name: "Updated User",
    });

    vi.mocked(register).mockResolvedValue(registerResponse);
    vi.mocked(updateMe).mockResolvedValue(updateResponse);

    renderWithAccountQuery(<AccountMutationsHarness />);

    await user.click(screen.getByRole("button", { name: "register" }));

    await waitFor(() => {
      expect(screen.getByTestId("cached-user")).toHaveTextContent("new@example.com");
    });
    expect(notifyAuthChanged).toHaveBeenCalledWith(registerResponse.user);
    expect(notifyAccountChanged).toHaveBeenCalledWith(registerResponse.user);

    await user.click(screen.getByRole("button", { name: "update profile" }));

    await waitFor(() => {
      expect(notifyAccountChanged).toHaveBeenLastCalledWith(updateResponse.user);
    });
    expect(vi.mocked(updateMe).mock.calls[0]?.[0]).toEqual({
      avatarUrl: undefined,
      name: "Updated User",
    });
  });

  it("clears current user and notifies consumers after logout", async () => {
    const user = userEvent.setup();

    vi.mocked(login).mockResolvedValue(createAuthResponse());
    vi.mocked(logout).mockResolvedValue({ ok: true });

    renderWithAccountQuery(<AccountMutationsHarness />);

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => {
      expect(screen.getByTestId("cached-user")).toHaveTextContent("demo@example.com");
    });

    await user.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => {
      expect(notifyAuthChanged).toHaveBeenLastCalledWith(null);
    });
    expect(notifyAccountChanged).toHaveBeenLastCalledWith(null);
  });

  it("invalidates favorites and notifies consumers after favorite removal", async () => {
    const user = userEvent.setup();

    vi.mocked(removeFavorite).mockResolvedValue({ ok: true });

    renderWithAccountQuery(<FavoriteMutationHarness />);

    await user.click(screen.getByRole("button", { name: "remove favorite" }));

    await waitFor(() => {
      expect(notifyFavoritesChanged).toHaveBeenCalledWith("product-1", false);
    });
  });
});
