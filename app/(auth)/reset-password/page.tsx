"use client";

import { useForm } from "react-hook-form";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AuthCardSkeleton, LoadingButtonContent } from "@/components/ui/loading";
import { UI } from "@/lib/strings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "كلمة المرور يجب أن 8 حروف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("الرمز غير صالح أو غير موجود");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (result?.error) {
        setError(
          translateAuthError(result.error.message) ||
            "تعذّر تغيير كلمة المرور"
        );
        setIsLoading(false);
        return;
      }

      toast.success("كلمة المرور تغيّرت");
      router.push("/login");
    } catch (err: unknown) {
      const message = translateAuthError(
        err instanceof Error ? err.message : null
      ) || "حدث خطأ. أعد المحاولة.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[60vh] mx-auto max-w-md">
      <div className="flex flex-col gap-4 h-full justify-center">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              تغيير كلمة المرور
            </CardTitle>
            <CardDescription className="text-center">
              ادخل كلمة المرور الجديدة
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
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
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
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                <LoadingButtonContent loading={isLoading} loadingLabel={UI.saving}>
                  <span>تغيير كلمة المرور</span>
                </LoadingButtonContent>
              </Button>

              <div className="flex items-center justify-center">
                <Link
                  href="/login"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="me-2 h-4 w-4" />
                  رجوع للدخول
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<AuthCardSkeleton />}>
            <ResetPasswordForm />
        </Suspense>
    );
}
