import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - صفحة الإدارة غير موجودة",
  description: "صفحة الإدارة التي تبحث عنها غير موجودة.",
};

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">صفحة الإدارة غير موجودة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="text-6xl font-bold text-muted-foreground/20">404</p>
            <p className="text-muted-foreground">
              صفحة الإدارة التي تبحث عنها غير موجودة أو ليس لديك صلاحية
              الوصول إليها.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/admin" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                لوحة تحكم الإدارة
              </Link>
            </Button>
            <BackButton />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">صفحات إدارية شائعة:</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Link
                href="/admin/tickets"
                className="text-xs text-primary hover:underline"
              >
                التذاكر
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                href="/admin/users"
                className="text-xs text-primary hover:underline"
              >
                المستخدمون
              </Link>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                href="/admin/settings"
                className="text-xs text-primary hover:underline"
              >
                الإعدادات
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
