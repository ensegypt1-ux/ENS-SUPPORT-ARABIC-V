"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState, Suspense } from "react";
import type { LoginFormData } from "@/types";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCardSkeleton, LoadingButtonContent } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateAuthError } from "@/lib/auth-errors";
import { LoginBrandPanel } from "@/components/auth/login-brand-panel";
import { ENS_BRAND } from "@/lib/ens-brand";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectUrl = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(
          translateAuthError(result.error.message) ||
            "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );
        setIsLoading(false);
        return;
      }

      const session = await authClient.getSession();

      let destination = redirectUrl || "/dashboard";

      if (!redirectUrl && session?.data?.user) {
        const userRole = (session.data.user as SessionUser).role;
        if (userRole === "admin") {
          destination = "/admin";
        } else if (userRole === "support") {
          destination = "/support-agent";
        }
      }

      router.push(destination);
      router.refresh();
    } catch (_err) {
      setError("حدث خطأ. أعد المحاولة.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <LoginBrandPanel variant="compact" className="lg:hidden" />

      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14">
        <div
          className={cn(
            "w-full max-w-[26rem] animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          )}
        >
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
            <header className="mb-6 text-start">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {ENS_BRAND.loginTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {ENS_BRAND.loginSubtitle}
              </p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-start">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-11 rounded-xl border-border/60 bg-background"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-start text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-start">
                    كلمة المرور
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-border/60 bg-background"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-start text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm"
                disabled={isLoading}
              >
                <LoadingButtonContent
                  loading={isLoading}
                  loadingLabel="جاري تسجيل الدخول…"
                >
                  <span>{ENS_BRAND.loginTitle}</span>
                </LoadingButtonContent>
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                href={
                  redirectUrl
                    ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                    : "/register"
                }
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                إنشاء حساب
              </Link>
            </p>
          </div>
        </div>
      </section>

      <LoginBrandPanel
        variant="full"
        className="hidden lg:flex lg:w-[min(46%,520px)] lg:shrink-0 lg:border-s lg:border-border/50"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="flex flex-1 items-center justify-center p-6">
        <AuthCardSkeleton />
      </div>
      <div className="hidden w-[min(46%,520px)] shrink-0 bg-muted/30 lg:block" />
    </div>
  );
}
