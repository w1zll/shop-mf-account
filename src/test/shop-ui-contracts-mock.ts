export const SHOP_EVENTS = {
  cartChanged: "shop:cart-changed",
  accountChanged: "shop:account-changed",
  favoritesChanged: "shop:favorites-changed",
  authChanged: "shop:auth-changed",
} as const;

export function dispatchShopEvent(name: string, detail: unknown) {
  return window.dispatchEvent(new CustomEvent(name, { detail }));
}
