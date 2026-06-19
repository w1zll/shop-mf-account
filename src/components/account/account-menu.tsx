import { CircleUserRound, Heart } from "lucide-react";
import { Button } from "@w1zll/shop-ui";
import { useState } from "react";

import "../../remote-styles";
import { useLogoutMutation, useMeQuery } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

function AccountMenuView() {
  const { data, isError, isLoading } = useMeQuery();
  const logoutMutation = useLogoutMutation();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="account-sm-up">
        <Button
          aria-label="Аккаунт загружается"
          className="size-10 p-0"
          disabled
          type="button"
          variant="ghost"
        >
          <CircleUserRound className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  if (isError || !data?.user) {
    return (
      <div className="account-sm-up">
        <Button asChild aria-label="Войти в аккаунт" className="size-10 p-0" variant="ghost">
          <a href="/login">
            <Heart className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="account-sm-up relative">
      <Button
        aria-expanded={isOpen}
        aria-label="Меню аккаунта"
        className="size-10 p-0"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        type="button"
        variant="ghost"
      >
        <CircleUserRound className="size-4" aria-hidden="true" />
      </Button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-lg border border-[var(--shop-border)] bg-[var(--shop-background)] p-3 shadow-lg">
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-semibold">{data.user.name}</p>
            <p className="truncate text-xs text-[var(--shop-muted-foreground)]">
              {data.user.email}
            </p>
          </div>
          <div className="grid gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/account">Профиль</a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/account/orders">Заказы</a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href="/account/favorites">Избранное</a>
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

export function AccountMenu() {
  return withAccountProvider(<AccountMenuView />);
}

export default AccountMenu;
