import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetAccountQueryClientForTests } from "../../lib/account-query";
import { ProfilePage } from "./profile-page";

function createResponse(body: unknown, status = 200) {
  return {
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
}

function createProfileResponse(name = "Demo User", avatarUrl: string | null = "https://cdn.example/avatar.png") {
  return {
    user: {
      avatarUrl,
      bonusBalanceCents: 12_500,
      email: "demo@example.com",
      id: "user-1",
      name,
      role: "USER",
    },
  };
}

afterEach(() => {
  cleanup();
  resetAccountQueryClientForTests();
  vi.unstubAllGlobals();
});

describe("ProfilePage", () => {
  it("loads current user and updates profile", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      (input, init) => {
      const url = getRequestUrl(input);

      if (url.endsWith("/users/me") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(createResponse(createProfileResponse()));
      }

      if (url.endsWith("/auth/csrf")) {
        return Promise.resolve(createResponse({ csrfToken: "csrf-token" }));
      }

      if (url.endsWith("/users/me") && init?.method === "PATCH") {
        return Promise.resolve(createResponse(createProfileResponse("Updated User", null)));
      }

      return Promise.resolve(createResponse({ message: "Unexpected request" }, 500));
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePage />);

    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Профиль" })).toBeInTheDocument();
    expect(screen.getByText("demo@example.com")).toBeInTheDocument();
    expect(screen.getByText("12500")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Имя"));
    await user.type(screen.getByLabelText("Имя"), "Updated User");
    await user.clear(screen.getByLabelText("Avatar URL"));
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Профиль обновлён.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/users/me",
      expect.objectContaining({
        body: JSON.stringify({
          name: "Updated User",
        }),
        method: "PATCH",
      }),
    );
  });

  it("shows validation message for invalid avatar URL", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      (input, init) => {
      const url = getRequestUrl(input);

      if (url.endsWith("/users/me") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(createResponse(createProfileResponse()));
      }

      return Promise.resolve(createResponse({ message: "Unexpected request" }, 500));
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<ProfilePage />);

    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Профиль" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Avatar URL"));
    await user.type(screen.getByLabelText("Avatar URL"), "not-a-url");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Укажите корректный URL")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) => getRequestUrl(input).endsWith("/users/me") && init?.method === "PATCH",
      ),
    ).toBe(false);
  });
});
