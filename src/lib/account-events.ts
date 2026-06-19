import { dispatchShopEvent, SHOP_EVENTS } from "@w1zll/shop-ui/contracts";

import { AccountUser } from "./account-types";

export function notifyAuthChanged(user: AccountUser | null) {
  dispatchShopEvent(SHOP_EVENTS.authChanged, {
    isAuthenticated: Boolean(user),
    userId: user?.id ?? null,
  });
}

export function notifyAccountChanged(user: AccountUser | null) {
  dispatchShopEvent(SHOP_EVENTS.accountChanged, {
    email: user?.email,
    name: user?.name ?? null,
    userId: user?.id ?? null,
  });
}

export function notifyFavoritesChanged(productId: string, isFavorite: boolean) {
  dispatchShopEvent(SHOP_EVENTS.favoritesChanged, {
    productId,
    isFavorite,
  });
}
