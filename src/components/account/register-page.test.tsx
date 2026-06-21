import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetAccountQueryClientForTests } from "../../lib/account-query";
import { RegisterPage } from "./register-page";

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

function createRegisterFetchMock() {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = getRequestUrl(input);

    if (url.endsWith("/auth/csrf")) {
      return Promise.resolve(createResponse({ csrfToken: "csrf-token" }));
    }

    if (url.endsWith("/auth/register") && init?.method === "POST") {
      return Promise.resolve(
        createResponse(
          {
            user: {
              avatarUrl: null,
              bonusBalanceCents: 0,
              email: "demo@example.com",
              id: "user-1",
              name: "Demo User",
              role: "USER",
            },
          },
          201,
        ),
      );
    }

    return Promise.resolve(createResponse({ message: "Unexpected request" }, 500));
  });
}

afterEach(() => {
  cleanup();
  resetAccountQueryClientForTests();
  vi.unstubAllGlobals();
});

describe("RegisterPage", () => {
  it("keeps registration on form when required fields are invalid", async () => {
    const fetchMock = createRegisterFetchMock();

    vi.stubGlobal("fetch", fetchMock);

    render(<RegisterPage />);

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(await screen.findByText("Укажите имя")).toBeInTheDocument();
    expect(screen.getByText("Укажите корректный email")).toBeInTheDocument();
    expect(screen.getByText("Минимум 8 символов")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([input]) => getRequestUrl(input).endsWith("/auth/register")),
    ).toBe(false);
  });

  it("registers through Auth API and redirects to account page", async () => {
    const assign = vi.fn();
    const fetchMock = createRegisterFetchMock();

    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });

    render(<RegisterPage />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Имя"), "Demo User");
    await user.type(screen.getByLabelText("Email"), "demo@example.com");
    await user.type(screen.getByLabelText("Пароль"), "password123");
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(await screen.findByRole("heading", { name: "Регистрация" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      expect.objectContaining({
        body: JSON.stringify({
          email: "demo@example.com",
          name: "Demo User",
          password: "password123",
        }),
        method: "POST",
      }),
    );
    expect(assign).toHaveBeenCalledWith("/account");
  });
});
