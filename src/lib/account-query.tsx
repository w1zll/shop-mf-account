import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactNode, useMemo } from "react";

import {
  getFavorites,
  getMe,
  getOrders,
  login,
  logout,
  register,
  removeFavorite,
  updateMe,
} from "./account-api";
import { notifyAccountChanged, notifyAuthChanged, notifyFavoritesChanged } from "./account-events";

export const accountQueryKeys = {
  favorites: ["favorites"] as const,
  me: ["me"] as const,
  orders: ["orders"] as const,
};

let sharedQueryClient: QueryClient | null = null;

function getSharedQueryClient() {
  sharedQueryClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 15_000,
      },
    },
  });

  return sharedQueryClient;
}

export function resetAccountQueryClientForTests() {
  sharedQueryClient?.clear();
}

export function AccountQueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = useMemo(() => getSharedQueryClient(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function useMeQuery() {
  return useQuery({
    queryFn: getMe,
    queryKey: accountQueryKeys.me,
  });
}

export function useFavoritesQuery() {
  return useQuery({
    queryFn: getFavorites,
    queryKey: accountQueryKeys.favorites,
  });
}

export function useOrdersQuery() {
  return useQuery({
    queryFn: () => getOrders(),
    queryKey: accountQueryKeys.orders,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess(response) {
      queryClient.setQueryData(accountQueryKeys.me, response);
      notifyAuthChanged(response.user);
      notifyAccountChanged(response.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess(response) {
      queryClient.setQueryData(accountQueryKeys.me, response);
      notifyAuthChanged(response.user);
      notifyAccountChanged(response.user);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess() {
      queryClient.removeQueries({ queryKey: accountQueryKeys.me });
      notifyAuthChanged(null);
      notifyAccountChanged(null);
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess(response) {
      queryClient.setQueryData(accountQueryKeys.me, response);
      notifyAccountChanged(response.user);
    },
  });
}

export function useRemoveFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFavorite,
    onSuccess(_response, productId) {
      void queryClient.invalidateQueries({ queryKey: accountQueryKeys.favorites });
      notifyFavoritesChanged(productId, false);
    },
  });
}
