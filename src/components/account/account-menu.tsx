import { Button, ErrorState, LoadingState } from "@w1zll/shop-ui";

import "../../remote-styles";
import { useLogoutMutation, useMeQuery } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

function AccountMenuView() {
  const { data, isError, isLoading } = useMeQuery();
  const logoutMutation = useLogoutMutation();

  if (isLoading) {
    return <LoadingState label="Загружаем аккаунт" />;
  }

  if (isError || !data?.user) {
    return <ErrorState title="Вы не вошли" description="Войдите, чтобы открыть меню аккаунта." />;
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-lg border border-[var(--shop-border)] p-4">
      <div>
        <h2 className="font-semibold">{data.user.name}</h2>
        <p className="text-sm text-[var(--shop-muted-foreground)]">{data.user.email}</p>
      </div>
      <div className="grid gap-2">
        <Button asChild variant="outline">
          <a href="/account">Профиль</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/account/orders">Заказы</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/account/favorites">Избранное</a>
        </Button>
        <Button
          disabled={logoutMutation.isPending}
          onClick={() => {
            logoutMutation.mutate();
          }}
          type="button"
          variant="ghost"
        >
          Выйти
        </Button>
      </div>
    </div>
  );
}

export function AccountMenu() {
  return withAccountProvider(<AccountMenuView />);
}

export default AccountMenu;
