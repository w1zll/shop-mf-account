import { Container, ErrorState, LoadingState, Price } from "@w1zll/shop-ui";

import "../../remote-styles";
import { useOrdersQuery } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

function OrdersPageView() {
  const { data, isError, isLoading } = useOrdersQuery();

  if (isLoading) {
    return <LoadingState label="Загружаем заказы" />;
  }

  if (isError || !data) {
    return (
      <Container className="py-8">
        <ErrorState title="Заказы недоступны" description="Войдите или попробуйте позже." />
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Заказы</h1>
        <p className="mt-2 text-sm text-[var(--shop-muted-foreground)]">
          История заказов текущего пользователя.
        </p>
      </div>
      {data.items.length === 0 ? (
        <p className="text-sm text-[var(--shop-muted-foreground)]">Заказов пока нет.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((order) => (
            <article className="rounded-lg border border-[var(--shop-border)] p-4" key={order.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{order.number}</h2>
                  <p className="text-sm text-[var(--shop-muted-foreground)]">{order.status}</p>
                </div>
                <Price className="font-semibold" valueCents={order.totalCents} />
              </div>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}

export function OrdersPage() {
  return withAccountProvider(<OrdersPageView />);
}

export default OrdersPage;
