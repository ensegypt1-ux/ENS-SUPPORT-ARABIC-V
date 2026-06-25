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
import Link from "next/link";
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { PanelFormActions } from "@/components/ui/panel-form";
import { EDIT_FORM_UI, PRIORITY_LABELS, UI } from "@/lib/strings";

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

export default function AdminEditCustomizationPage({
  params,
}: EditCustomizationPageProps) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          router.push(`/admin/tickets/${id}`);
          return;
        }

        // Populate form
        setValue("title", ticket.title);
        setValue("description", ticket.description);
        setValue("priority", ticket.priority);
        setValue("productName", ticket.productName || "");
        setValue("productVersion", ticket.productVersion || "");

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error loading ticket:", error);
        setError("تعذّر التحميل طلب التخصيص");
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [params, router, setValue]);

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
      router.push(`/admin/customization/${ticketId}`);
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
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={EDIT_FORM_UI.editCustomizationTitle}
        description={EDIT_FORM_UI.editCustomizationDesc}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/customization/${ticketId}`}>
              <ArrowLeft className="me-2 h-4 w-4 rtl:-scale-x-100" />
              {UI.back}
            </Link>
          </Button>
        }
      />

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{EDIT_FORM_UI.requestDetails}</CardTitle>
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
                العنوان <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="وصف موجز للتخصيص"
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
                الوصف <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="وصف تفصيلي لما تحتاج تخصيصه..."
                rows={8}
                {...register("description")}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                الأولوية <span className="text-destructive">*</span>
              </Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setValue("priority", value as any, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{PRIORITY_LABELS.low}</SelectItem>
                  <SelectItem value="medium">{PRIORITY_LABELS.medium}</SelectItem>
                  <SelectItem value="high">{PRIORITY_LABELS.high}</SelectItem>
                  <SelectItem value="urgent">{PRIORITY_LABELS.urgent}</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">اسم المنتج</Label>
                <Input
                  id="productName"
                  placeholder="مثال: ENS"
                  {...register("productName")}
                  disabled={isSubmitting}
                />
                {errors.productName && (
                  <p className="text-sm text-destructive">
                    {errors.productName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productVersion">إصدار المنتج</Label>
                <Input
                  id="productVersion"
                  placeholder="مثال: 2.1.0"
                  {...register("productVersion")}
                  disabled={isSubmitting}
                />
                {errors.productVersion && (
                  <p className="text-sm text-destructive">
                    {errors.productVersion.message}
                  </p>
                )}
              </div>
            </div>

            <PanelFormActions className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/customization/${ticketId}`)}
                disabled={isSubmitting}
              >
                {UI.cancel}
              </Button>
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                <LoadingButtonContent loading={isSubmitting} loadingLabel={EDIT_FORM_UI.updating}>
                  <>
                    <Save className="h-4 w-4" />
                    <span>{EDIT_FORM_UI.updateRequest}</span>
                  </>
                </LoadingButtonContent>
              </Button>
            </PanelFormActions>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
