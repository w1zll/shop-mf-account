import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button, Container, Logo } from "@w1zll/shop-ui";
import { useEffect, useMemo, useState } from "react";

import { AccountBadge } from "../components/account/account-badge";
import { AccountMenu } from "../components/account/account-menu";
import { FavoritesPage } from "../components/account/favorites-page";
import { LoginPage } from "../components/account/login-page";
import { OrdersPage } from "../components/account/orders-page";
import { ProfilePage } from "../components/account/profile-page";
import { RegisterPage } from "../components/account/register-page";

const routes = [
  "/",
  "/login",
  "/register",
  "/account",
  "/account/orders",
  "/account/favorites",
] as const;
type StandaloneRoute = (typeof routes)[number];

function readRoute(): StandaloneRoute {
  const pathname = window.location.pathname;
  return routes.includes(pathname as StandaloneRoute) ? (pathname as StandaloneRoute) : "/";
}

function StandaloneHeader() {
  const [route, setRoute] = useState<StandaloneRoute>(() => readRoute());

  useEffect(() => {
    function handlePopState() {
      setRoute(readRoute());
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function navigate(nextRoute: StandaloneRoute) {
    window.history.pushState(null, "", nextRoute);
    setRoute(nextRoute);
  }

  return (
    <>
      <header className="border-b border-[var(--shop-border)]">
        <Container className="flex min-h-16 items-center justify-between gap-4">
          <button
            aria-label="На главную"
            className="appearance-none border-0 bg-transparent p-0"
            onClick={() => {
              navigate("/");
            }}
            type="button"
          >
            <Logo />
          </button>
          <nav className="flex items-center gap-2" aria-label="Навигация account remote">
            <Button
              onClick={() => {
                navigate("/login");
              }}
              type="button"
              variant="ghost"
            >
              Вход
            </Button>
            <Button
              onClick={() => {
                navigate("/account");
              }}
              type="button"
              variant="ghost"
            >
              Профиль
            </Button>
            <Button
              onClick={() => {
                navigate("/account/orders");
              }}
              type="button"
              variant="ghost"
            >
              Заказы
            </Button>
            <AccountBadge />
          </nav>
        </Container>
      </header>
      <StandaloneRouteContent route={route} />
    </>
  );
}

function StandaloneRouteContent({ route }: Readonly<{ route: StandaloneRoute }>) {
  if (route === "/login") {
    return <LoginPage />;
  }

  if (route === "/register") {
    return <RegisterPage />;
  }

  if (route === "/account") {
    return <ProfilePage />;
  }

  if (route === "/account/orders") {
    return <OrdersPage />;
  }

  if (route === "/account/favorites") {
    return <FavoritesPage />;
  }

  return (
    <Container className="grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-normal">Account remote</h1>
        <p className="text-base leading-7 text-[var(--shop-muted-foreground)]">
          Standalone-приложение для разработки аккаунта. Данные загружаются через Auth, Account,
          Favorites и Orders API.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/login">Войти</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/register">Регистрация</a>
          </Button>
        </div>
      </section>
      <AccountMenu />
    </Container>
  );
}

export function StandaloneApp() {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <StandaloneHeader />
    </QueryClientProvider>
  );
}
