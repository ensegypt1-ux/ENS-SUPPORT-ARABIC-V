"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateInstallationSchema } from "@/lib/validations";
import { updateInstallationContent, getTicketById } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { notFound } from "next/navigation";

interface EditInstallationPageProps {
  params: Promise<{ id: string }>;
}

interface InstallationFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  productName?: string;
  productVersion?: string;
}

export default function EditInstallationPage({
  params,
}: EditInstallationPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InstallationFormData>({
    resolver: zodResolver(updateInstallationSchema),
  });

  const priority = watch("priority");

  // Load ticket data
  useEffect(() => {
    async function loadTicket() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        setTicketId(id);

        const result = await getTicketById(id);
        if (!result.success || !result.data) {
          notFound();
        }

        const ticket = result.data;

        // Verify it's an installation request
        if (ticket.category !== "technical_support") {
          notFound();
        }

        // Pre-populate form
        setValue("title", ticket.title);
        setValue("description", ticket.description);
        setValue("priority", ticket.priority);
        setValue("productName", ticket.productName || "");
        setValue("productVersion", ticket.productVersion || "");

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading ticket:", error);
        setError("تعذّر التحميل طلب التثبيت");
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [params, setValue]);

  const onSubmit = async (data: InstallationFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await updateInstallationContent(ticketId, data);

      if (!result.success) {
        setError(result.error || "تعذّر التحديث طلب التثبيت");
        toast.error(result.error || "تعذّر التحديث طلب التثبيت");
        setIsSubmitting(false);
        return;
      }

      toast.success("اتحدّث طلب التثبيت!");
      router.push(`/dashboard/installation/${ticketId}`);
      router.refresh();
    } catch (error: any) {
      setError(error.message || "حصل خطأ مش متوقع");
      toast.error(error.message || "حصل خطأ مش متوقع");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold">تعديل طلب التثبيت</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            تحديث تفاصيل طلب التثبيت الخاص بك
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/installation/${ticketId}`}>
            <ArrowLeft className="h-4 w-4 me-1" />
            رجوع إلى التفاصيل
          </Link>
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التثبيت</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Installation Request Title{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="مثال: التثبيت على استضافة مشتركة، الإعداد على خادم VPS"
                {...register("title")}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Installation Requirements{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder=" تقديم معلومات مفصلة عن احتياجات التثبيت..."
                rows={10}
                {...register("description")}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Include details about your hosting environment, server access,
                and any specific requirements.
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                الأولوية <span className="text-destructive">*</span>
              </Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue("priority", value as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة - جدول زمني مرن</SelectItem>
                  <SelectItem value="medium">
                    متوسطة - خلال أيام قليلة
                  </SelectItem>
                  <SelectItem value="high">
                    عالية - مطلوب خلال 24 ساعة
                  </SelectItem>
                  <SelectItem value="urgent">
                    عاجلة - حرجة، في أقرب وقت
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold">معلومات المنتج (اختياري)</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productName">اسم المنتج</Label>
                  <Input
                    id="productName"
                    placeholder="مثال: إضافتي الرائعة"
                    {...register("productName")}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productVersion">إصدار المنتج</Label>
                  <Input
                    id="productVersion"
                    placeholder="مثال: 1.0.0"
                    {...register("productVersion")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="me-2 h-4 w-4" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
