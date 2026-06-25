"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPublicTicketSchema } from "@/lib/validations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LifeBuoy,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { getEnvatoSettingsAction } from "@/actions/envato";
import {
  createPublicTicket,
  getPublicTicketCategories,
  getPublicTicketDepartments,
  getPublicTicketProducts,
  verifyPublicPurchaseCode,
} from "@/actions/public-tickets";
import { FORM_UI, PRIORITY_LABELS, TICKET_UI, UI } from "@/lib/strings";

type PublicTicketFormData = z.infer<typeof createPublicTicketSchema>;

const priorities = [
  { value: "low", label: PRIORITY_LABELS.low, color: "bg-slate-400" },
  { value: "medium", label: PRIORITY_LABELS.medium, color: "bg-blue-500" },
  { value: "high", label: PRIORITY_LABELS.high, color: "bg-amber-500" },
  { value: "urgent", label: PRIORITY_LABELS.urgent, color: "bg-red-500" },
];

export function PublicTicketForm() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successTicketNumber, setSuccessTicketNumber] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState(false);

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

  const [envatoSettings, setEnvatoSettings] = useState<{
    enabled: boolean;
    requirePurchaseCode: boolean;
  }>({ enabled: false, requirePurchaseCode: false });
  const [isVerifyingPurchaseCode, setIsVerifyingPurchaseCode] = useState(false);
  const [purchaseCodeVerified, setPurchaseCodeVerified] = useState(false);
  const [purchaseCodeError, setPurchaseCodeError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PublicTicketFormData>({
    resolver: zodResolver(createPublicTicketSchema),
    defaultValues: {
      priority: "medium",
      category: "general",
    },
  });

  const priority = watch("priority");
  const category = watch("category");
  const departmentSlug = watch("departmentSlug");
  const productSlug = watch("productSlug");
  const purchaseCode = watch("purchaseCode");
  const timezone = watch("timezone");

  useEffect(() => {
    const fetchEnvatoSettings = async () => {
      const result = await getEnvatoSettingsAction();
      if (result.success && result.data) {
        setEnvatoSettings(result.data);
      }
    };
    void fetchEnvatoSettings();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const result = await getPublicTicketCategories();
        if (result.success && result.data) {
          setCategories(
            result.data.map((c) => ({ value: c.slug, label: c.name }))
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
        const result = await getPublicTicketDepartments();
        if (result.success && result.data) {
          setDepartments(
            result.data.map((d) => ({ value: d.slug, label: d.name }))
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
        const result = await getPublicTicketProducts();
        if (result.success && result.data) {
          setProducts(
            result.data.map((p) => ({ value: p.slug, label: p.name }))
          );
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    void loadCategories();
    void loadDepartments();
    void loadProducts();
  }, []);

  useEffect(() => {
    if (!productParam || products.length === 0) return;
    const match = products.find((p) => p.value === productParam);
    if (match) {
      setValue("productSlug", match.value);
    }
  }, [productParam, products, setValue]);

  // Reset verification state whenever the code changes.
  useEffect(() => {
    setPurchaseCodeVerified(false);
    setPurchaseCodeError("");
  }, [purchaseCode]);

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
      const result = await verifyPublicPurchaseCode(code);
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

  const onSubmit = async (data: PublicTicketFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await createPublicTicket(data);
      if (!result.success || !result.data) {
        setError(result.error || "تعذّر إنشاء التذكرة");
        toast.error(result.error || "تعذّر إنشاء التذكرة");
        setIsSubmitting(false);
        return;
      }

      setSuccessTicketNumber(result.data.ticketNumber);
      toast.success("التذكرة تم الإرسال!");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : FORM_UI.unexpectedError;
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!successTicketNumber) return;
    try {
      await navigator.clipboard.writeText(successTicketNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (successTicketNumber) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-border/60 bg-background p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ticket submitted
          </h1>
          <p className="mt-2 text-muted-foreground">
            Thanks for reaching out. Our team has received your request and a
            confirmation has been sent to your email.
          </p>

          <div className="mt-6 rounded-xl border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Your ticket number
            </p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-mono text-lg font-semibold">
                {successTicketNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="نسخ رقم التذكرة"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                setSuccessTicketNumber(null);
                setIsSubmitting(false);
              }}
              variant="outline"
              className="h-11"
            >
              Submit another ticket
            </Button>
            <Button asChild className="h-11">
              <Link href="/">العودة للرئيسية</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-0">
      <div className="mb-8 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
          <LifeBuoy className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Support
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Create a support ticket
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tell us what you need help with. No account required — we&apos;ll
          email you a confirmation and updates.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Your Details */}
            <div className="space-y-6 rounded-2xl border border-border/60 bg-background shadow-sm p-6">
              <h2 className="text-lg font-semibold">بياناتك</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="محمد أحمد"
                    {...register("name")}
                    disabled={isSubmitting}
                    className="h-11 placeholder:text-muted-foreground/50"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    {...register("email")}
                    disabled={isSubmitting}
                    className="h-11 placeholder:text-muted-foreground/50"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* General */}
            <div className="space-y-6 rounded-2xl border border-border/60 bg-background shadow-sm p-6">
              <h2 className="text-lg font-semibold">عام</h2>
              <div className="space-y-2">
                <Label htmlFor="title">
                  Ticket Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="ملخص موجز لمشكلتك"
                  {...register("title")}
                  disabled={isSubmitting}
                  className="h-11 placeholder:text-muted-foreground/50"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="صِف مشكلتك أو طلبك بالتفصيل..."
                  {...register("description")}
                  disabled={isSubmitting}
                  className="min-h-[140px] resize-none placeholder:text-muted-foreground/50"
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Product Verification */}
            {envatoSettings.enabled && (
              <div className="space-y-6 rounded-2xl border border-border/60 bg-background shadow-sm p-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Product Verification
                    {envatoSettings.requirePurchaseCode && (
                      <span className="ms-1 text-destructive">*</span>
                    )}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verify your purchase for priority support
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseCode">
                    Purchase Code
                    {envatoSettings.requirePurchaseCode && (
                      <span className="ms-1 text-destructive">*</span>
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
                          "h-11 pe-10 font-mono",
                          purchaseCodeVerified &&
                            "border-green-500 focus-visible:ring-green-500",
                          purchaseCodeError && "border-destructive"
                        )}
                      />
                      {purchaseCodeVerified && (
                        <CheckCircle2 className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                      )}
                      {purchaseCodeError && !purchaseCodeVerified && (
                        <XCircle className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" />
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
                          "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      {isVerifyingPurchaseCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : purchaseCodeVerified ? (
                        <>
                          <CheckCircle2 className="me-2 h-4 w-4" />
                          Verified
                        </>
                      ) : (
                        "تحقق"
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
                        Please verify your purchase code to submit this ticket
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-5 rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
              {/* Priority */}
              <div className="space-y-2">
                <Label>
                  Priority
                </Label>
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
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setValue(
                      "category",
                      value as PublicTicketFormData["category"]
                    )
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCategories ? (
                      <SelectItem value="general" disabled>
                        جاري التحميل…
                      </SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="general" disabled>
                        No categories
                      </SelectItem>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label>
                  Department
                </Label>
                <Select
                  value={departmentSlug || ""}
                  onValueChange={(value) => setValue("departmentSlug", value)}
                  disabled={isSubmitting || loadingDepartments}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingDepartments ? (
                      <SelectItem value="__loading" disabled>
                        جاري التحميل…
                      </SelectItem>
                    ) : departments.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No departments
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
              <div className="space-y-2">
                <Label>
                  Product
                </Label>
                <Select
                  value={productSlug || ""}
                  onValueChange={(value) => setValue("productSlug", value)}
                  disabled={isSubmitting || loadingProducts}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="اختر منتجاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProducts ? (
                      <SelectItem value="__loading" disabled>
                        جاري التحميل…
                      </SelectItem>
                    ) : products.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        No products available
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
              <div className="space-y-2">
                <Label>
                  Timezone
                </Label>
                <TimezoneSelect
                  value={timezone}
                  onValueChange={(value) => setValue("timezone", value)}
                  disabled={isSubmitting}
                  placeholder={FORM_UI.selectTimezone}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background shadow-sm p-5">
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={
                  isSubmitting ||
                  (envatoSettings.requirePurchaseCode && !purchaseCodeVerified)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  UI.submit
                )}
              </Button>
              <Button asChild type="button" variant="outline" className="h-11 w-full">
                <Link href="/">{UI.cancel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
