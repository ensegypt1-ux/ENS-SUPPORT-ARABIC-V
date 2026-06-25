import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Home, LogIn } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - الصفحة دي غير موجودة",
  description: "صفحة الدخول اللي بتبحث عليها غير موجودة.",
};

/**
 * Auth Routes Not Found Page
 */
export default function AuthNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">الصفحة دي غير موجودة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="text-6xl font-bold text-muted-foreground/20">404</p>
            <p className="text-muted-foreground">
              صفحة الدخول اللي بتبحث عليها غير موجودة.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/login" className="gap-2">
                <LogIn className="h-4 w-4" />
                انتقل إلى للدخول
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                الصفحة الرئيسية
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              معندكش حساب؟{" "}
              <Link href="/register" className="text-primary hover:underline">
                افتح حساب
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
