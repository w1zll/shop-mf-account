import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Button, Container, Input, Label } from "@w1zll/shop-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import "../../remote-styles";
import { useLoginMutation } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

const loginSchema = z.object({
  email: z.email("Укажите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPageView() {
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginFormValues) {
    setError(null);
    loginMutation.mutate(values, {
      onError(mutationError) {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось войти.");
      },
      onSuccess() {
        window.location.assign("/account");
      },
    });
  }

  return (
    <Container className="max-w-xl space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">Вход</h1>
        <p className="text-sm text-[var(--shop-muted-foreground)]">
          Войдите, чтобы увидеть профиль, избранное и историю заказов.
        </p>
      </div>
      {error ? <p className="text-sm text-[var(--shop-destructive)]">{error}</p> : null}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" autoComplete="email" type="email" {...register("email")} />
        </Field>
        <Field label="Пароль" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            autoComplete="current-password"
            type="password"
            {...register("password")}
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Входим..." : "Войти"}
          </Button>
          <Button asChild variant="outline">
            <a href="/register">Создать аккаунт</a>
          </Button>
        </div>
      </form>
    </Container>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: Readonly<{ children: ReactNode; error?: string; htmlFor: string; label: string }>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-[var(--shop-destructive)]">{error}</p> : null}
    </div>
  );
}

export function LoginPage() {
  return withAccountProvider(<LoginPageView />);
}

export default LoginPage;
