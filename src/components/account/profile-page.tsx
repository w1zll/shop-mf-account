import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { Button, Container, ErrorState, Input, Label, LoadingState, Price } from "@w1zll/shop-ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import "../../remote-styles";
import { useMeQuery, useUpdateProfileMutation } from "../../lib/account-query";
import { withAccountProvider } from "./account-shell";

const profileSchema = z.object({
  avatarUrl: z.union([z.literal(""), z.url("Укажите корректный URL")]).optional(),
  name: z.string().min(2, "Укажите имя"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilePageView() {
  const { data, isError, isLoading } = useMeQuery();
  const updateMutation = useUpdateProfileMutation();
  const [message, setMessage] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      avatarUrl: "",
      name: "",
    },
  });

  useEffect(() => {
    if (data?.user) {
      reset({
        avatarUrl: data.user.avatarUrl ?? "",
        name: data.user.name,
      });
    }
  }, [data, reset]);

  function onSubmit(values: ProfileFormValues) {
    setMessage(null);
    updateMutation.mutate(
      {
        avatarUrl: values.avatarUrl?.trim() || undefined,
        name: values.name,
      },
      {
        onError(error) {
          setMessage(error instanceof Error ? error.message : "Не удалось обновить профиль.");
        },
        onSuccess() {
          setMessage("Профиль обновлён.");
        },
      },
    );
  }

  if (isLoading) {
    return <LoadingState label="Загружаем профиль" />;
  }

  if (isError || !data?.user) {
    return (
      <Container className="py-8">
        <ErrorState title="Нужен вход" description="Войдите, чтобы открыть профиль." />
      </Container>
    );
  }

  return (
    <Container className="grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Профиль</h1>
          <p className="mt-2 text-sm text-[var(--shop-muted-foreground)]">{data.user.email}</p>
        </div>
        {message ? <p className="text-sm text-[var(--shop-muted-foreground)]">{message}</p> : null}
        <form
          className="space-y-4"
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <Field label="Имя" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...register("name")} />
          </Field>
          <Field label="Avatar URL" htmlFor="avatarUrl" error={errors.avatarUrl?.message}>
            <Input id="avatarUrl" autoComplete="url" {...register("avatarUrl")} />
          </Field>
          <Button disabled={updateMutation.isPending} type="submit">
            {updateMutation.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </form>
      </section>
      <aside className="h-fit space-y-3 rounded-lg border border-[var(--shop-border)] p-4">
        <h2 className="font-semibold">Бонусы</h2>
        <Price className="text-xl font-semibold" valueCents={data.user.bonusBalanceCents} />
      </aside>
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

export function ProfilePage() {
  return withAccountProvider(<ProfilePageView />);
}

export default ProfilePage;
