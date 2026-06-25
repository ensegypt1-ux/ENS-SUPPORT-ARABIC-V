"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("أدخل بريدًا إلكترونيًا صالحًا"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await (authClient as any).requestPasswordReset({
        email: data.email,
        redirectTo: "/reset-password",
      });

      if (result?.error) {
        setError(
          translateAuthError(result.error.message) ||
            "تعذّر إرسال البريد الإلكتروني"
        );
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("تم إرسال البريد الإلكتروني");
      setIsLoading(false);
    } catch (err: unknown) {
      const message = translateAuthError(
        err instanceof Error ? err.message : null
      ) || "حدث خطأ. أعد المحاولة.";
      setError(message);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full h-[60vh] mx-auto max-w-md">
        <div className="flex flex-col gap-4 h-full justify-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                تحقّق من بريدك الإلكتروني
              </CardTitle>
              <CardDescription className="text-center">
                أرسلنا رابط تغيير كلمة المرور إلى بريدك الإلكتروني.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  رجوع إلى تسجيل الدخول
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[60vh] mx-auto max-w-md">
      <div className="flex flex-col gap-4 h-full justify-center">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              نسيت كلمة المرور
            </CardTitle>
            <CardDescription className="text-center">
              أدخل البريد الإلكتروني وسنرسل لك رابطًا لتغيير كلمة المرور
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
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري الإرسال…
                  </>
                ) : (
                  "أرسل رابط التغيير"
                )}
              </Button>

              <div className="flex items-center justify-center">
                <Link
                  href="/login"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="me-2 h-4 w-4" />
                  رجوع إلى تسجيل الدخول
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
