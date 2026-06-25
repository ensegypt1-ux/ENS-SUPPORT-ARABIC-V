import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">غير مصرّح</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            ليس لديك صلاحية للوصول إلى هذه الصفحة.
          </p>
          <p className="text-sm text-muted-foreground">
            إذا كنت تعتقد أن هذا خطأ،  التواصل مع المسؤول.
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">الذهاب إلى لوحة التحكم</Link>
            </Button>
            <Button asChild>
              <Link href="/">الذهاب للصفحة الرئيسية</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
