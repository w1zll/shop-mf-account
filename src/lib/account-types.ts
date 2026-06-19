export interface AccountUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bonusBalanceCents: number;
  role: string;
}

export interface AuthResponse {
  user: AccountUser;
}

export interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  priceCents: number;
  oldPriceCents: number | null;
  stock: number;
  imageUrl: string | null;
}

export interface Favorite {
  id: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
}

export interface FavoritesResponse {
  items: Favorite[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
}

export interface Order {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  discountCents: number;
  bonusSpentCents: number;
  deliveryCents: number;
  totalCents: number;
  deliveryMethod: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrdersResponse {
  items: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
