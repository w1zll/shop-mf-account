import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Button, Container, Input, Label } from "@w1zll/shop-ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import "../../remote-styles";
import { useRegisterMutation } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

const registerSchema = z.object({
  email: z.email("Укажите корректный email"),
  name: z.string().min(2, "Укажите имя"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterPageView() {
  const [error, setError] = useState<string | null>(null);
  const registerMutation = useRegisterMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    setError(null);
    registerMutation.mutate(values, {
      onError(mutationError) {
        setError(
          mutationError instanceof Error ? mutationError.message : "Не удалось зарегистрироваться.",
        );
      },
      onSuccess() {
        window.location.assign("/account");
      },
    });
  }

  return (
    <Container className="max-w-xl space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">Регистрация</h1>
        <p className="text-sm text-[var(--shop-muted-foreground)]">
          Создайте аккаунт для избранного, заказов и бонусов.
        </p>
      </div>
      {error ? <p className="text-sm text-[var(--shop-destructive)]">{error}</p> : null}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <Field label="Имя" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" autoComplete="email" type="email" {...register("email")} />
        </Field>
        <Field label="Пароль" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            autoComplete="new-password"
            type="password"
            {...register("password")}
          />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button disabled={registerMutation.isPending} type="submit">
            {registerMutation.isPending ? "Создаём..." : "Создать аккаунт"}
          </Button>
          <Button asChild variant="outline">
            <a href="/login">Уже есть аккаунт</a>
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

export function RegisterPage() {
  return withAccountProvider(<RegisterPageView />);
}

export default RegisterPage;
