"use client";

import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm, type Resolver } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicket } from "@/actions/tickets";
import { adminCreateTicket } from "@/actions/admin";
import type { AdminCreateTicketFormData } from "@/types";
import {
  createTicketSchema,
  adminCreateTicketSchema,
} from "@/lib/validations";
import { uploadTicketAttachments } from "@/actions/attachments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Loader2,
  AlertCircle,
  Plus,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { FileUploadPreview } from "@/components/attachments/file-upload-preview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createTicketCategory,
  getActiveTicketCategories,
} from "@/actions/ticket-categories";
import { getActiveTicketProducts } from "@/actions/ticket-products";
import { getActiveTicketDepartments } from "@/actions/ticket-departments";
import {
  getEnvatoSettingsAction,
  verifyPurchaseCodeAction,
} from "@/actions/envato";
import { FORM_UI, PRIORITY_LABELS, TICKET_UI, UI } from "@/lib/strings";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface TicketFormProps {
  /**
   * "customer" renders the self-service form (default). "admin" adds the
   * required customer selector + inline "فئة جديدة" add, and submits via
   * the admin server action. Everything else is identical.
   */
  variant?: "admin" | "customer";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TicketForm({ variant = "customer" }: TicketFormProps) {
  const isAdmin = variant === "admin";
  const router = useRouter();

  const breadcrumbRoot = isAdmin
    ? { label: FORM_UI.adminBreadcrumb, href: "/admin" }
    : { label: UI.dashboard, href: "/dashboard" };
  const ticketsHref = isAdmin ? "/admin/tickets" : "/dashboard/tickets";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [categories, setCategories] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [departments, setDepartments] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [products, setProducts] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Admin-only: customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Admin-only: inline category creation
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  // Envato purchase code verification
  const [envatoSettings, setEnvatoSettings] = useState<{
    enabled: boolean;
    requirePurchaseCode: boolean;
  }>({ enabled: false, requirePurchaseCode: false });
  const [isVerifyingPurchaseCode, setIsVerifyingPurchaseCode] = useState(false);
  const [purchaseCodeVerified, setPurchaseCodeVerified] = useState(false);
  const [purchaseCodeError, setPurchaseCodeError] = useState("");

  const resolver = (
    isAdmin
      ? zodResolver(adminCreateTicketSchema)
      : zodResolver(createTicketSchema)
  ) as Resolver<AdminCreateTicketFormData>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminCreateTicketFormData>({
    resolver,
    defaultValues: {
      priority: "medium",
      category: "general",
    },
  });

  const priority = watch("priority");
  const category = watch("category");
  const customerId = watch("customerId");
  const departmentSlug = watch("departmentSlug");
  const productSlug = watch("productSlug");
  const purchaseCode = watch("purchaseCode");
  const timezone = watch("timezone");

  // Envato settings (controls the Product Verification section)
  useEffect(() => {
    const fetchEnvatoSettings = async () => {
      const result = await getEnvatoSettingsAction();
      if (result.success && result.data) {
        setEnvatoSettings(result.data);
      }
    };
    fetchEnvatoSettings();
  }, []);

  // Admin-only: fetch customers
  useEffect(() => {
    if (!isAdmin) return;
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        if (data.users) {
          const customerUsers = data.users.filter(
            (user: { role: string }) => user.role === "customer",
          );
          setCustomers(customerUsers);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        toast.error("تعذّر تحميل العملاء");
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, [isAdmin]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const result = await getActiveTicketCategories();
      if (result.success && result.data) {
        setCategories(
          result.data.map((c) => ({ value: c.slug, label: c.name })),
        );
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const result = await getActiveTicketDepartments();
      if (result.success && result.data) {
        setDepartments(
          result.data.map((d) => ({ value: d.slug, label: d.name })),
        );
      } else {
        setDepartments([]);
      }
    } catch {
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const result = await getActiveTicketProducts();
      if (result.success && result.data) {
        setProducts(result.data.map((p) => ({ value: p.slug, label: p.name })));
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    void loadDepartments();
    void loadProducts();
  }, []);

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleVerifyPurchaseCode = async () => {
    const code = purchaseCode?.trim();
    if (!code) {
      setPurchaseCodeError("اكتب كود الشراء");
      setPurchaseCodeVerified(false);
      return;
    }

    setIsVerifyingPurchaseCode(true);
    setPurchaseCodeError("");
    setPurchaseCodeVerified(false);

    try {
      const result = await verifyPurchaseCodeAction(code);
      if (result.success) {
        setPurchaseCodeVerified(true);
        setPurchaseCodeError("");
        toast.success("كود الشراء متأكد!");
      } else {
        setPurchaseCodeVerified(false);
        setPurchaseCodeError(result.error || "التحقق غير ناجح");
        toast.error(result.error || "التحقق غير ناجح");
      }
    } catch {
      setPurchaseCodeVerified(false);
      setPurchaseCodeError("حدث خطأ في التحقق");
      toast.error("حدث خطأ في التحقق");
    } finally {
      setIsVerifyingPurchaseCode(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("اسم الفئة مطلوب");
      return;
    }
    setAddingCategory(true);
    try {
      const result = await createTicketCategory({
        name: newCategoryName.trim(),
        slug: newCategorySlug.trim() || undefined,
      });
      if (result.success) {
        toast.success("تمت الإضافةت الفئة");
        const slug = (newCategorySlug.trim() || slugify(newCategoryName)).trim();
        setAddCategoryOpen(false);
        setNewCategoryName("");
        setNewCategorySlug("");
        await loadCategories();
        if (slug) {
          setValue(
            "category",
            slug as unknown as AdminCreateTicketFormData["category"],
          );
        }
      } else {
        toast.error(result.error || "تعذّر إضافة الفئة");
      }
    } catch {
      toast.error("تعذّر إضافة الفئة");
    } finally {
      setAddingCategory(false);
    }
  };

  const onSubmit = async (data: AdminCreateTicketFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = isAdmin
        ? await adminCreateTicket(data)
        : await createTicket(data);

      if (!result.success) {
        setError(result.error || "تعذّر إنشاء التذكرة");
        toast.error(result.error || "تعذّر إنشاء التذكرة");
        setIsSubmitting(false);
        return;
      }

      const ticketId =
        typeof result.data?._id === "string"
          ? result.data._id
          : result.data?._id?.toString();

      if (selectedFiles.length > 0 && ticketId) {
        const formData = new FormData();
        selectedFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });

        const uploadResult = await uploadTicketAttachments(ticketId, formData);
        if (!uploadResult.success) {
          toast.warning(
            `تم إنشاء التذكرة ولكن بعض الملفات لم تُرفع${
              uploadResult.error ? `: ${uploadResult.error}` : ""
            }`,
          );
        } else if (uploadResult.data && uploadResult.data.length > 0) {
          toast.success(
            `تم إنشاء التذكرة مع ${uploadResult.data.length} ${FORM_UI.attachmentWord}`,
          );
        } else {
          toast.success("تم إنشاء التذكرة");
        }
      } else {
        toast.success("تم إنشاء التذكرة");
      }

      router.push(`${ticketsHref}/${ticketId}`);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : FORM_UI.unexpectedError;
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const customerOptions: ComboboxOption[] = customers.map((customer) => ({
    value: customer.id,
    label: customer.name,
    description: customer.email,
    keywords: [customer.email],
  }));

  const priorities = [
    { value: "low", label: PRIORITY_LABELS.low, color: "bg-slate-400" },
    { value: "medium", label: PRIORITY_LABELS.medium, color: "bg-blue-500" },
    { value: "high", label: PRIORITY_LABELS.high, color: "bg-amber-500" },
    { value: "urgent", label: PRIORITY_LABELS.urgent, color: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5 py-5">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link
                href={breadcrumbRoot.href}
                className="hover:text-foreground transition-colors"
              >
                {breadcrumbRoot.label}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link
                href={ticketsHref}
                className="hover:text-foreground transition-colors"
              >
                {UI.tickets}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-foreground">افتح تذكرة</span>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              افتح تذكرة جديدة
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form id="ticket-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* General Section */}
              <div className="bg-background rounded-xl border p-6 space-y-6">
                <h2 className="text-lg font-semibold">عام</h2>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {FORM_UI.requestTitle}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={FORM_UI.requestTitlePlaceholder}
                    {...register("title")}
                    disabled={isSubmitting}
                    className="h-11 placeholder:text-muted-foreground/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    {FORM_UI.requestTitleHint}
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
                    {UI.description}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={FORM_UI.requirementsPlaceholder}
                    {...register("description")}
                    disabled={isSubmitting}
                    className="resize-none placeholder:text-muted-foreground/50 min-h-30"
                  />
                  <p className="text-xs text-muted-foreground">
                    اكتب وصف واضح للتذكرة.
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
                  <h2 className="text-lg font-semibold">{TICKET_UI.attachments}</h2>
                  <FileUploadPreview
                    onFilesChange={handleFilesChange}
                    disabled={isSubmitting}
                    maxFiles={5}
                    maxFileSize={20971520}
                  />
                  <p className="text-xs text-muted-foreground">
                    {FORM_UI.attachmentsHint}
                  </p>
                </div>
              )}

              {/* Product Verification - Conditional on Envato settings */}
              {envatoSettings.enabled && (
                <div className="bg-background rounded-xl border p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {FORM_UI.productInfo}
                      {envatoSettings.requirePurchaseCode && (
                        <span className="text-destructive ms-1">*</span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {FORM_UI.productInfoHint}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseCode">
                      {TICKET_UI.purchaseCode}
                      {envatoSettings.requirePurchaseCode && (
                        <span className="text-destructive ms-1">*</span>
                      )}
                    </Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          id="purchaseCode"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          {...register("purchaseCode")}
                          disabled={isSubmitting || isVerifyingPurchaseCode}
                          className={cn(
                            "font-mono h-11 pe-10",
                            purchaseCodeVerified &&
                              "border-green-500 focus-visible:ring-green-500",
                            purchaseCodeError && "border-destructive",
                          )}
                        />
                        {purchaseCodeVerified && (
                          <CheckCircle2 className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                        )}
                        {purchaseCodeError && !purchaseCodeVerified && (
                          <XCircle className="absolute end-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant={purchaseCodeVerified ? "default" : "outline"}
                        onClick={handleVerifyPurchaseCode}
                        disabled={
                          isSubmitting ||
                          isVerifyingPurchaseCode ||
                          !purchaseCode ||
                          purchaseCodeVerified
                        }
                        className={cn(
                          "h-11",
                          purchaseCodeVerified &&
                            "bg-green-600 hover:bg-green-700",
                        )}
                      >
                        {isVerifyingPurchaseCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : purchaseCodeVerified ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 me-2" />
                            متأكد
                          </>
                        ) : (
                          "تحقّق"
                        )}
                      </Button>
                    </div>
                    {purchaseCodeError && (
                      <p className="text-sm text-destructive">
                        {purchaseCodeError}
                      </p>
                    )}
                    {errors.purchaseCode && (
                      <p className="text-sm text-destructive">
                        {errors.purchaseCode.message}
                      </p>
                    )}
                  </div>

                  {envatoSettings.requirePurchaseCode &&
                    !purchaseCodeVerified &&
                    purchaseCode && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          تحقّق من كود الشراء قبل ما تبعت التذكرة
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Details card — merged Customer / Priority / Category / Department / Product / Timezone */}
              <div className="bg-background rounded-xl border divide-y">
                {/* Customer (admin only) */}
                {isAdmin && (
                  <div className="p-5 space-y-2">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {TICKET_UI.customer}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Combobox
                      options={customerOptions}
                      value={customerId}
                      onValueChange={(value) => setValue("customerId", value)}
                      disabled={isSubmitting || loadingCustomers}
                      placeholder={
                        loadingCustomers
                          ? `${UI.loading}`
                          : FORM_UI.selectCustomerPlaceholder
                      }
                      searchPlaceholder={FORM_UI.searchCustomers}
                      emptyMessage={FORM_UI.noCustomersFound}
                      className="h-10"
                      aria-invalid={errors.customerId ? "true" : undefined}
                    />
                    {errors.customerId && (
                      <p className="text-sm text-destructive">
                        {errors.customerId.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Priority */}
                <div className="p-5 space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {UI.priority}
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setValue(
                        "priority",
                        value as "low" | "medium" | "high" | "urgent",
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={FORM_UI.selectPriority} />
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
                  {errors.priority && (
                    <p className="text-sm text-destructive">
                      {errors.priority.message}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="p-5 space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {UI.category}
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      if (value === "__add_new__") {
                        setAddCategoryOpen(true);
                        return;
                      }
                      setValue(
                        "category",
                        value as unknown as AdminCreateTicketFormData["category"],
                      );
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={`اختر ${UI.category}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCategories ? (
                        <SelectItem value="general" disabled>
                          {UI.loading}
                        </SelectItem>
                      ) : categories.length === 0 ? (
                        <SelectItem value="general" disabled>
                          لا يوجد فئات
                        </SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))
                      )}
                      {isAdmin && (
                        <SelectItem value="__add_new__" disabled={isSubmitting}>
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            فئة جديدة
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Department */}
                <div className="p-5 space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {TICKET_UI.department}
                  </Label>
                  <Select
                    value={departmentSlug || ""}
                    onValueChange={(value) => setValue("departmentSlug", value)}
                    disabled={isSubmitting || loadingDepartments}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={`اختر ${TICKET_UI.department}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingDepartments ? (
                        <SelectItem value="__loading" disabled>
                          {UI.loading}
                        </SelectItem>
                      ) : departments.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          لا يوجد أقسام
                        </SelectItem>
                      ) : (
                        departments.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product */}
                <div className="p-5 space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {TICKET_UI.product}
                  </Label>
                  <Select
                    value={productSlug || ""}
                    onValueChange={(value) => setValue("productSlug", value)}
                    disabled={isSubmitting || loadingProducts}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={`اختر ${TICKET_UI.product}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProducts ? (
                        <SelectItem value="__loading" disabled>
                          {UI.loading}
                        </SelectItem>
                      ) : products.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          لا يوجد منتجات
                        </SelectItem>
                      ) : (
                        products.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className="p-5 space-y-2">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {FORM_UI.timezone}
                  </Label>
                  <TimezoneSelect
                    value={timezone}
                    onValueChange={(value) => setValue("timezone", value)}
                    disabled={isSubmitting}
                    placeholder={
                      isAdmin
                        ? "اختر المنطقة الزمنية للعميل"
                        : FORM_UI.selectTimezone
                    }
                  />
                  {errors.timezone && (
                    <p className="text-sm text-destructive">
                      {errors.timezone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="bg-background rounded-xl border p-5 space-y-2">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={
                    isSubmitting ||
                    (envatoSettings.requirePurchaseCode && !purchaseCodeVerified)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {isAdmin ? FORM_UI.creating : "جاري الإرسال..."}
                    </>
                  ) : isAdmin ? (
                    "افتح تذكرة"
                  ) : (
                    UI.submit
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  {UI.cancel}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Admin-only: New Category dialog */}
      {isAdmin && (
        <Dialog
          open={addCategoryOpen}
          onOpenChange={(open) => !addingCategory && setAddCategoryOpen(open)}
        >
          <DialogContent className="sm:max-w-130">
            <DialogHeader>
              <DialogTitle>فئة جديدة</DialogTitle>
              <DialogDescription>
                أضف فئة تذكرة جديدة. ستظهر في قوائم فتح التذاكر.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{UI.name}</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-11"
                  disabled={addingCategory}
                />
              </div>
              <div className="space-y-2">
                <Label>المعرّف ({UI.optional})</Label>
                <Input
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  className="h-11"
                  disabled={addingCategory}
                />
                <p className="text-xs text-muted-foreground">
                  إذا سيبته فاضي، هيتعمل من الاسم.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCategoryOpen(false)}
                disabled={addingCategory}
              >
                {UI.cancel}
              </Button>
              <Button
                type="button"
                onClick={handleAddCategory}
                disabled={addingCategory}
              >
                {addingCategory ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {UI.loading}
                  </>
                ) : (
                  <>
                    <Plus className="me-2 h-4 w-4" />
                    {UI.create}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
