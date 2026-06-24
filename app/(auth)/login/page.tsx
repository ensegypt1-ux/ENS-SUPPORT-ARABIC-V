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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        setError(result.error.message || "الإيميل أو كلمة المرور مش صح");
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
      setError("حصل خطأ. جرّب تاني.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-8 mx-auto max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            دخول لحسابك
          </CardTitle>
          <CardDescription className="text-center">
            ادخل إيميلك وكلمة المرور عشان توصل لتذاكر الدعم
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pb-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">الإيميل</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  بيدخل...
                </>
              ) : (
                "دخول"
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              معندكش حساب؟{" "}
              <Link
                href={
                  redirectUrl
                    ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                    : "/register"
                }
                className="font-medium text-info hover:text-info/90"
              >
                افتح حساب
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full max-w-md">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
