# shop-mf-account

React/Rspack Module Federation remote для пользовательского аккаунта интернет-магазина Shop MFS.

## Назначение

`shop-mf-account` отвечает за клиентскую часть аккаунта:

- бейдж пользователя в Header;
- меню аккаунта;
- вход и регистрацию;
- профиль пользователя;
- историю заказов;
- избранные товары.

Remote работает как самостоятельное приложение на `http://localhost:3003` и как набор exposed-компонентов для `shop-shell`.

## Технологии

- React 19;
- TypeScript;
- Rspack;
- Module Federation;
- Tailwind CSS;
- TanStack Query;
- React Hook Form;
- Zod;
- `@w1zll/shop-ui@0.2.0`.

## Exposes

```text
./AccountBadge
./AccountMenu
./LoginPage
./RegisterPage
./ProfilePage
./OrdersPage
./FavoritesPage
```

Manifest доступен по адресу:

```text
http://localhost:3003/mf-manifest.json
```

## API

Браузерные запросы идут same-origin через `/api/v1`.
Standalone dev-server проксирует `/api/*` на `API_ORIGIN`.

По умолчанию:

```text
API_ORIGIN=http://localhost:4000
```

Для unsafe-запросов (`POST`, `PATCH`, `DELETE`) remote сначала получает CSRF через:

```text
GET /api/v1/auth/csrf
```

Затем отправляет `X-CSRF-Token` и `credentials: include`.

## Локальный запуск

```bash
pnpm install
pnpm dev
```

Открыть:

```text
http://localhost:3003
```

Для полноценной проверки нужен запущенный `shop-api` на `http://localhost:4000`.

## Проверки

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## События

Remote использует контракты `@w1zll/shop-ui/contracts` и отправляет общие browser-события:

- `shop:auth-changed` после login/register/logout;
- `shop:account-changed` после обновления профиля;
- `shop:favorites-changed` после изменения избранного.

Эти события нужны shell и другим микрофронтендам для синхронизации UI без прямой зависимости между remotes.

## Переменные окружения

См. `.env.example`.

Не записывайте реальные секреты в `.env` и не коммитьте локальные `.env` файлы.
