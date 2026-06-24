"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTicket } from "@/actions/tickets";
import type { CreateTicketFormData } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketSchema } from "@/lib/validations";
import { uploadTicketAttachments } from "@/actions/attachments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { FileUploadPreview } from "@/components/attachments/file-upload-preview";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { cn } from "@/lib/utils";

export default function NewCustomizationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: "medium",
      category: "feature_request",
    },
  });

  const priority = watch("priority");
  const timezone = watch("timezone");

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await createTicket({
        ...data,
        category: "feature_request",
      });

      if (!result.success) {
        setError(result.error || "تعذّر الإنشاء طلب التخصيص");
        toast.error(result.error || "تعذّر الإنشاء طلب التخصيص");
        setIsSubmitting(false);
        return;
      }

      const ticketId = result.data?._id.toString();

      if (selectedFiles.length > 0 && ticketId) {
        const formData = new FormData();
        selectedFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });

        const uploadResult = await uploadTicketAttachments(ticketId, formData);

        if (!uploadResult.success) {
          toast.warning(
            `اتعمل الطلب لكن تعذّر رفع بعض الملفات: ${uploadResult.error}`
          );
        } else if (uploadResult.data && uploadResult.data.length > 0) {
          toast.success(
            `اتعمل طلب التخصيص مع ${uploadResult.data.length} مرفق(ات)!`
          );
        } else {
          toast.success("اتعمل طلب التخصيص!");
        }
      } else {
        toast.success("اتعمل طلب التخصيص!");
      }

      router.push(`/dashboard/customization/${ticketId}`);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "حصل خطأ مش متوقع";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const priorities = [
    { value: "low", label: "منخفضة - بدون استعجال", color: "bg-slate-400" },
    {
      value: "medium",
      label: "متوسطة - جدول زمني قياسي",
      color: "bg-blue-500",
    },
    { value: "high", label: "عالية - مطلوب قريبًا", color: "bg-amber-500" },
    {
      value: "urgent",
      label: "عاجلة - Critical for business",
      color: "bg-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5 py-5">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                لوحة التحكم
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href="/dashboard/customization"
                className="hover:text-foreground transition-colors"
              >
                التخصيص
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-foreground">طلب جديد</span>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              طلب تخصيص
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form id="customization-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* General Section */}
              <div className="bg-background rounded-xl border p-6 space-y-6">
                <h2 className="text-lg font-semibold">تفاصيل التخصيص</h2>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Customization Title{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="أدخل عنوان طلب التخصيص"
                    {...register("title")}
                    disabled={isSubmitting}
                    className="h-11 placeholder:text-muted-foreground/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    العنوان مطلوب ويُفضّل أن يكون فريدًا.
                  </p>
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Detailed Description{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="صف متطلبات التخصيص..."
                    {...register("description")}
                    disabled={isSubmitting}
                    className="resize-none placeholder:text-muted-foreground/50 min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    The more details you provide, the better we can understand
                    and estimate your customization request.
                  </p>
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              {process.env.NEXT_PUBLIC_FILE_UPLOADS_ENABLED === "true" && (
                <div className="bg-background rounded-xl border p-6 space-y-4">
                  <h2 className="text-lg font-semibold">المرفقات</h2>
                  <p className="text-xs text-muted-foreground">
                    ارفع تصميمات أو أمثلة أو أي ملفات توضّح احتياجات التخصيص
                  </p>
                  <FileUploadPreview
                    onFilesChange={handleFilesChange}
                    disabled={isSubmitting}
                    maxFiles={5}
                    maxFileSize={20971520}
                  />
                  <p className="text-xs text-muted-foreground">الملفات:</p>
                </div>
              )}

              {/* Product Information */}
              {process.env.NEXT_PUBLIC_PURCHASE_CODE_VALIDATION_ENABLED ===
                "true" && (
                <div className="bg-background rounded-xl border p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      معلومات المنتج
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      تفاصيل المنتج الاختيارية لطلب التخصيص
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="productName">اسم المنتج</Label>
                      <Input
                        id="productName"
                        placeholder="مثال: إضافتي الرائعة"
                        {...register("productName")}
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productVersion">إصدار المنتج</Label>
                      <Input
                        id="productVersion"
                        placeholder="مثال: 1.0.0"
                        {...register("productVersion")}
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseCode">رمز الشراء</Label>
                    <Input
                      id="purchaseCode"
                      placeholder="أدخل رمز شراء Envato الخاص بك"
                      {...register("purchaseCode")}
                      disabled={isSubmitting}
                      className="h-11 font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      أدخل رمز شراء Envato الخاص بك if applicable
                    </p>
                    {errors.purchaseCode && (
                      <p className="text-sm text-destructive">
                        {errors.purchaseCode.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Priority */}
              <div className="bg-background rounded-xl border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">الأولوية</h2>
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      priority === "low" && "bg-slate-400",
                      priority === "medium" && "bg-blue-500",
                      priority === "high" && "bg-amber-500",
                      priority === "urgent" && "bg-red-500"
                    )}
                  />
                </div>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setValue(
                      "priority",
                      value as "low" | "medium" | "high" | "urgent"
                    )
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("h-2 w-2 rounded-full", p.color)}
                          />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Set the customization priority.
                </p>
                {errors.priority && (
                  <p className="text-sm text-destructive">
                    {errors.priority.message}
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div className="bg-background rounded-xl border p-6 space-y-4">
                <h2 className="text-lg font-semibold">المنطقة الزمنية</h2>
                <TimezoneSelect
                  value={timezone}
                  onValueChange={(value) => setValue("timezone", value)}
                  disabled={isSubmitting}
                  placeholder="اختر المنطقة الزمنية"
                />
                <p className="text-xs text-muted-foreground">
                  حدد منطقتك الزمنية لجدولة الاجتماعات أو المكالمات.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="bg-background rounded-xl border p-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    "إرسال الطلب"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
