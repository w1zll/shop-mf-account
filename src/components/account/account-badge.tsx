import { CircleUserRound } from "lucide-react";
import { Badge, Button, Price } from "@w1zll/shop-ui";
import { useState } from "react";

import "../../remote-styles";
import { useLogoutMutation, useMeQuery } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

function AccountBadgeView() {
  const { data, isError, isLoading } = useMeQuery();
  const logoutMutation = useLogoutMutation();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <Button
        aria-label="Аккаунт загружается"
        className="size-10 p-0"
        disabled
        type="button"
        variant="outline"
      >
        <CircleUserRound className="size-4" aria-hidden="true" />
      </Button>
    );
  }

  if (isError || !data?.user) {
    return (
      <Button asChild className="size-10 p-0" variant="outline">
        <a href="/login" aria-label="Войти в аккаунт">
          <CircleUserRound className="size-4" aria-hidden="true" />
        </a>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Меню аккаунта ${data.user.name}`}
        className="size-10 p-0"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        type="button"
        variant="outline"
      >
        <CircleUserRound className="size-4" aria-hidden="true" />
      </Button>
      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-lg border border-[var(--shop-border)] bg-[var(--shop-background)] p-3 shadow-lg"
          role="menu"
        >
          <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data.user.name}</p>
              <p className="truncate text-xs text-[var(--shop-muted-foreground)]">
                {data.user.email}
              </p>
            </div>
            <Badge className="shrink-0">
              <Price valueCents={data.user.bonusBalanceCents} />
            </Badge>
          </div>
          <div className="grid gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/account" role="menuitem">
                Профиль
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/account/orders" role="menuitem">
                Заказы
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/account/favorites" role="menuitem">
                Избранное
              </a>
            </Button>
            <Button
              disabled={logoutMutation.isPending}
              onClick={() => {
                logoutMutation.mutate(undefined, {
                  onSuccess() {
                    setIsOpen(false);
                  },
                });
              }}
              role="menuitem"
              size="sm"
              type="button"
              variant="ghost"
            >
              Выйти
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AccountBadge() {
  return withAccountProvider(<AccountBadgeView />);
}

export default AccountBadge;
