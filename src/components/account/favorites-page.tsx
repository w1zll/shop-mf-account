import { Button, Container, ErrorState, LoadingState, Price } from "@w1zll/shop-ui";

import "../../remote-styles";
import { useFavoritesQuery, useRemoveFavoriteMutation } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

function FavoritesPageView() {
  const { data, isError, isLoading } = useFavoritesQuery();
  const removeMutation = useRemoveFavoriteMutation();

  if (isLoading) {
    return <LoadingState label="Загружаем избранное" />;
  }

  if (isError || !data) {
    return (
      <Container className="py-8">
        <ErrorState title="Избранное недоступно" description="Войдите или попробуйте позже." />
      </Container>
    );
  }

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Избранное</h1>
        <p className="mt-2 text-sm text-[var(--shop-muted-foreground)]">
          Товары, сохранённые в аккаунте.
        </p>
      </div>
      {data.items.length === 0 ? (
        <p className="text-sm text-[var(--shop-muted-foreground)]">Избранных товаров пока нет.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.map((favorite) => (
            <article
              className="rounded-lg border border-[var(--shop-border)] p-4"
              key={favorite.id}
            >
              <h2 className="font-semibold">{favorite.product.name}</h2>
              <p className="mt-1 text-sm text-[var(--shop-muted-foreground)]">
                {favorite.product.brand}
              </p>
              <Price
                className="mt-3 block font-semibold"
                valueCents={favorite.product.priceCents}
              />
              <Button
                className="mt-4"
                disabled={removeMutation.isPending}
                onClick={() => {
                  removeMutation.mutate(favorite.productId);
                }}
                type="button"
                variant="outline"
              >
                Удалить
              </Button>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}

export function FavoritesPage() {
  return withAccountProvider(<FavoritesPageView />);
}

export default FavoritesPage;
