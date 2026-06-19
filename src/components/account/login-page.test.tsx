import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetAccountQueryClientForTests } from "../../lib/account-query";
import { LoginPage } from "./login-page";

function createResponse(body: unknown, status = 200) {
  return {
    json: () => Promise.resolve(body),
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

afterEach(() => {
  cleanup();
  resetAccountQueryClientForTests();
  vi.unstubAllGlobals();
});

describe("LoginPage", () => {
  it("logs in through Auth API", async () => {
    const assign = vi.fn();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.endsWith("/auth/csrf")) {
        return Promise.resolve(createResponse({ csrfToken: "csrf-token" }));
      }

      if (url.endsWith("/auth/login") && init?.method === "POST") {
        return Promise.resolve(
          createResponse({
            user: {
              id: "user-1",
              email: "demo@example.com",
              name: "Demo User",
              avatarUrl: null,
              bonusBalanceCents: 0,
              role: "USER",
            },
          }),
        );
      }

      return Promise.resolve(createResponse({ message: "Unexpected request" }, 500));
    });

    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });

    render(<LoginPage />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "demo@example.com");
    await user.type(screen.getByLabelText("Пароль"), "password123");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("heading", { name: "Вход" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(assign).toHaveBeenCalledWith("/account");
  });
});
