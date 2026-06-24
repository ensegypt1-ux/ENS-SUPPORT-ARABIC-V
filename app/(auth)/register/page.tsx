"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { signUp } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { RegisterFormData } from "@/types";
import { registerSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect URL from query params
  const redirectUrl = searchParams.get("redirect");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const country = watch("country");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // Sign up the user
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        country: data.country,
      } as Record<string, unknown> & { email: string; password: string; name: string });

      if (result.error) {
        setError(result.error.message || "تعذّر فتح الحساب");
        setIsLoading(false);
        return;
      }

      // After successful registration, user is automatically signed in by better-auth
      // Redirect based on user role
      let destination = redirectUrl || "/dashboard";

      // If no redirect URL is specified, check user role
      if (!redirectUrl && result.data?.user) {
        const userRole = (result.data.user as SessionUser).role;
        if (userRole === "admin" || userRole === "support") {
          destination = "/admin";
        }
      }

      router.push(destination);
      router.refresh();
    } catch {
      setError("حصل خطأ. جرّب تاني.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[70vh] mx-auto max-w-md">
      <div className="flex flex-col gap-4 h-full justify-center">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              افتح حساب
            </CardTitle>
            <CardDescription className="text-center">
              ادخل بياناتك عشان تفتح حساب الدعم
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
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="محمد أحمد"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">الإيميل</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">الدولة</Label>
                <CountryCombobox
                  id="country"
                  value={country}
                  onValueChange={(value) =>
                    setValue("country", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={isLoading}
                  placeholder="اختار دولتك"
                  aria-invalid={!!errors.country}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">
                    {errors.country.message}
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
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    بيفتح الحساب...
                  </>
                ) : (
                  "افتح حساب"
                )}
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                عندك حساب؟{" "}
                <Link
                  href={
                    redirectUrl
                      ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                      : "/login"
                  }
                  className="font-medium text-info hover:text-info/90"
                >
                  دخول
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full max-w-md">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
