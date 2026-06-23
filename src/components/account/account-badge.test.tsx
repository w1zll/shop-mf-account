import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { resetAccountQueryClientForTests } from "../../lib/account-query";
import { AccountBadge } from "./account-badge";

function createResponse(body: unknown) {
  return {
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
  } as Response;
}

afterEach(() => {
  cleanup();
  resetAccountQueryClientForTests();
  vi.unstubAllGlobals();
});

describe("AccountBadge", () => {
  it("opens account navigation with orders for an authenticated user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          createResponse({
            user: {
              avatarUrl: null,
              bonusBalanceCents: 12_500,
              email: "demo@example.com",
              id: "user-1",
              name: "Demo User",
              role: "USER",
            },
          }),
        ),
      ),
    );

    render(<AccountBadge />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Меню аккаунта Demo User" }));

    expect(screen.getByRole("menuitem", { name: "Заказы" })).toHaveAttribute(
      "href",
      "/account/orders",
    );
    expect(screen.getByRole("menuitem", { name: "Профиль" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("menuitem", { name: "Избранное" })).toHaveAttribute(
      "href",
      "/account/favorites",
    );
  });
});
