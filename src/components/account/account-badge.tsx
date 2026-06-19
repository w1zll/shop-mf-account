import { CircleUserRound } from "lucide-react";
import { Badge, Button, Price } from "@w1zll/shop-ui";

import "../../remote-styles";
import { useMeQuery } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

function AccountBadgeView() {
  const { data, isError, isLoading } = useMeQuery();

  if (isLoading) {
    return (
      <div className="account-sm-up">
        <Button className="gap-2" disabled type="button" variant="outline">
          <CircleUserRound className="size-4" aria-hidden="true" />
          Аккаунт
        </Button>
      </div>
    );
  }

  if (isError || !data?.user) {
    return (
      <Button asChild className="gap-2" variant="outline">
        <a href="/login">
          <CircleUserRound className="size-4" aria-hidden="true" />
          Войти
        </a>
      </Button>
    );
  }

  return (
    <Button asChild className="gap-2" variant="outline">
      <a href="/account" aria-label={`Аккаунт ${data.user.name}`}>
        <CircleUserRound className="size-4" aria-hidden="true" />
        <span className="account-sm-inline">{data.user.name}</span>
        <Badge>
          <Price valueCents={data.user.bonusBalanceCents} />
        </Badge>
      </a>
    </Button>
  );
}

export function AccountBadge() {
  return withAccountProvider(<AccountBadgeView />);
}

export default AccountBadge;
