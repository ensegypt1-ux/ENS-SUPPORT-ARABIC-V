"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCustomizationSchema } from "@/lib/validations";
import { updateCustomizationContent, getTicketById } from "@/actions/tickets";
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
import { ArrowLeft, Save } from "lucide-react";
import { FormPageSkeleton, LoadingButtonContent } from "@/components/ui/loading";
import { UI } from "@/lib/strings";
import Link from "next/link";
import { toast } from "sonner";
import { notFound } from "next/navigation";

interface EditCustomizationPageProps {
  params: Promise<{ id: string }>;
}

interface CustomizationFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  productName?: string;
  productVersion?: string;
}

export default function EditCustomizationPage({
  params,
}: EditCustomizationPageProps) {
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
  } = useForm<CustomizationFormData>({
    resolver: zodResolver(updateCustomizationSchema),
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

        // Verify it's a customization request
        if (ticket.category !== "feature_request") {
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
        setError("تعذّر التحميل طلب التخصيص");
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [params, setValue]);

  const onSubmit = async (data: CustomizationFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await updateCustomizationContent(ticketId, data);

      if (!result.success) {
        setError(result.error || "تعذّر التحديث طلب التخصيص");
        toast.error(result.error || "تعذّر التحديث طلب التخصيص");
        setIsSubmitting(false);
        return;
      }

      toast.success("تم التحديث طلب التخصيص!");
      router.push(`/dashboard/customization/${ticketId}`);
      router.refresh();
    } catch (error: any) {
      setError(error.message || "حدث خطأ غير متوقع");
      toast.error(error.message || "حدث خطأ غير متوقع");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <FormPageSkeleton fields={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold">تعديل طلب التخصيص</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            تحديث تفاصيل طلب التخصيص الخاص بك
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/customization/${ticketId}`}>
            <ArrowLeft className="h-4 w-4 me-1" />
            رجوع إلى التفاصيل
          </Link>
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل التخصيص</CardTitle>
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
                التخصيص العنوان <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="مثال: إضافة الوضع الداكن، تكامل بوابة دفع مخصصة"
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
                Detailed الوصف <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder=" تقديم معلومات مفصلة عن احتياجات التخصيص..."
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
                The more details you provide, the better we can understand and
                estimate your customization request.
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
                  <SelectItem value="low">منخفضة - بدون استعجال</SelectItem>
                  <SelectItem value="medium">
                    متوسطة - جدول زمني قياسي
                  </SelectItem>
                  <SelectItem value="high">عالية - مطلوب قريبًا</SelectItem>
                  <SelectItem value="urgent">
                    عاجلة - Critical for business
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
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                <LoadingButtonContent loading={isSubmitting} loadingLabel={UI.saving}>
                  <>
                    <Save className="h-4 w-4" />
                    <span>حفظ التغييرات</span>
                  </>
                </LoadingButtonContent>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
