"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect, type ReactNode } from "react";
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
  Copy,
  Check,
  User,
  FileText,
  SlidersHorizontal,
  ShieldCheck,
  Send,
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
import {
  CATEGORY_LABELS,
  FORM_UI,
  PRIORITY_FORM_LABELS,
  PRIORITY_LABELS,
  PUBLIC_TICKET_UI,
  TICKET_UI,
  UI,
} from "@/lib/strings";
import { homeVisual } from "@/lib/home-visual";
import type { TicketPriority } from "@/types";
import { PublicSecurityNotice } from "@/components/tickets/public-security-notice";

type PublicTicketFormData = z.infer<typeof createPublicTicketSchema>;

const priorities: Array<{
  value: TicketPriority;
  label: string;
  hint: string;
  color: string;
}> = [
  {
    value: "low",
    label: PRIORITY_LABELS.low,
    hint: PRIORITY_FORM_LABELS.low,
    color: "bg-slate-400",
  },
  {
    value: "medium",
    label: PRIORITY_LABELS.medium,
    hint: PRIORITY_FORM_LABELS.medium,
    color: "bg-blue-500",
  },
  {
    value: "high",
    label: PRIORITY_LABELS.high,
    hint: PRIORITY_FORM_LABELS.high,
    color: "bg-amber-500",
  },
  {
    value: "urgent",
    label: PRIORITY_LABELS.urgent,
    hint: PRIORITY_FORM_LABELS.urgent,
    color: "bg-red-500",
  },
];

function FormSection({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        homeVisual.surface,
        "space-y-5 p-5 sm:p-6",
        className
      )}
    >
      <header className="space-y-1.5 border-b border-border/45 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
        </div>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground pe-1">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
  );
}

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
            result.data.map((c) => ({
              value: c.slug,
              label: CATEGORY_LABELS[c.slug] ?? c.name,
            }))
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

  useEffect(() => {
    setPurchaseCodeVerified(false);
    setPurchaseCodeError("");
  }, [purchaseCode]);

  const handleVerifyPurchaseCode = async () => {
    const code = purchaseCode?.trim();
    if (!code) {
      setPurchaseCodeError("اكتب رمز الشراء");
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
        toast.success("تم التحقق من رمز الشراء");
      } else {
        setPurchaseCodeVerified(false);
        setPurchaseCodeError(result.error || "تعذّر التحقق من الرمز");
        toast.error(result.error || "تعذّر التحقق من الرمز");
      }
    } catch {
      setPurchaseCodeVerified(false);
      setPurchaseCodeError("حدث خطأ أثناء التحقق");
      toast.error("حدث خطأ أثناء التحقق");
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
      toast.success("تم إرسال التذكرة بنجاح");
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

  if (successTicketNumber) {
    return (
      <div
        className={cn(homeVisual.container, homeVisual.pageX, "py-12 sm:py-16")}
        dir="rtl"
      >
        <div
          className={cn(
            homeVisual.surface,
            "mx-auto max-w-lg p-8 text-center sm:p-10"
          )}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {PUBLIC_TICKET_UI.success.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {PUBLIC_TICKET_UI.success.description}
          </p>

          <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {PUBLIC_TICKET_UI.success.ticketLabel}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wide" dir="ltr">
                {successTicketNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={PUBLIC_TICKET_UI.success.copyAria}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {PUBLIC_TICKET_UI.success.trustNote}
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                setSuccessTicketNumber(null);
                setIsSubmitting(false);
              }}
              variant="outline"
              className="h-11"
            >
              {PUBLIC_TICKET_UI.success.another}
            </Button>
            <Button asChild className="h-11">
              <Link href="/">{PUBLIC_TICKET_UI.success.home}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(homeVisual.container, homeVisual.pageX, "py-8 sm:py-10 lg:py-12")}
      dir="rtl"
    >
      {/* Hero */}
      <header className="mb-8 text-right sm:mb-10">
        <p className={homeVisual.eyebrow}>
          <span className={homeVisual.eyebrowDot} aria-hidden />
          {PUBLIC_TICKET_UI.badge}
        </p>
        <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {PUBLIC_TICKET_UI.pageTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {PUBLIC_TICKET_UI.pageSubtitle}
        </p>
        <ol className={cn(homeVisual.journeyRow, "mt-5 justify-start sm:mt-6")}>
          {PUBLIC_TICKET_UI.journey.map((step, i) => (
            <li key={step} className="inline-flex items-center gap-1.5 sm:gap-2">
              {i > 0 ? (
                <span aria-hidden className="text-border/70">
                  ←
                </span>
              ) : null}
              <span className={homeVisual.journeyStep}>
                <span className={homeVisual.journeyNum}>{i + 1}</span>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </header>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            <FormSection
              icon={<User className="h-4 w-4" />}
              title={PUBLIC_TICKET_UI.sections.contact.title}
              description={PUBLIC_TICKET_UI.sections.contact.description}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className={homeVisual.fieldLabel}>
                    {PUBLIC_TICKET_UI.fields.name}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={PUBLIC_TICKET_UI.placeholders.name}
                    {...register("name")}
                    disabled={isSubmitting}
                    className="h-11 bg-background/80"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className={homeVisual.fieldLabel}>
                    {PUBLIC_TICKET_UI.fields.email}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    placeholder={PUBLIC_TICKET_UI.placeholders.email}
                    {...register("email")}
                    disabled={isSubmitting}
                    className="h-11 bg-background/80 text-start"
                    aria-invalid={Boolean(errors.email)}
                  />
                  <FieldHint>{PUBLIC_TICKET_UI.hints.email}</FieldHint>
                  {errors.email ? (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={<FileText className="h-4 w-4" />}
              title={PUBLIC_TICKET_UI.sections.ticket.title}
              description={PUBLIC_TICKET_UI.sections.ticket.description}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className={homeVisual.fieldLabel}>
                    {PUBLIC_TICKET_UI.fields.title}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={PUBLIC_TICKET_UI.placeholders.title}
                    {...register("title")}
                    disabled={isSubmitting}
                    className="h-11 bg-background/80"
                    aria-invalid={Boolean(errors.title)}
                  />
                  {errors.title ? (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className={homeVisual.fieldLabel}>
                    {PUBLIC_TICKET_UI.fields.description}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={PUBLIC_TICKET_UI.placeholders.description}
                    {...register("description")}
                    disabled={isSubmitting}
                    className="min-h-[160px] resize-y bg-background/80 sm:min-h-[180px]"
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description ? (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  ) : (
                    <FieldHint>{PUBLIC_TICKET_UI.hints.descriptionSecurity}</FieldHint>
                  )}
                </div>
              </div>
            </FormSection>

            <PublicSecurityNotice />

            {envatoSettings.enabled ? (
              <FormSection
                icon={<ShieldCheck className="h-4 w-4" />}
                title={PUBLIC_TICKET_UI.sections.purchase.title}
                description={PUBLIC_TICKET_UI.sections.purchase.description}
              >
                <div className="space-y-2">
                  <Label htmlFor="purchaseCode" className={homeVisual.fieldLabel}>
                    {PUBLIC_TICKET_UI.fields.purchaseCode}
                    {envatoSettings.requirePurchaseCode ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </Label>
                  <FieldHint>{PUBLIC_TICKET_UI.hints.purchaseCode}</FieldHint>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <div className="relative min-w-0 flex-1">
                      <Input
                        id="purchaseCode"
                        dir="ltr"
                        placeholder={PUBLIC_TICKET_UI.placeholders.purchaseCode}
                        {...register("purchaseCode")}
                        disabled={isSubmitting || isVerifyingPurchaseCode}
                        className={cn(
                          "h-11 pe-10 font-mono text-sm text-start",
                          purchaseCodeVerified &&
                            "border-success focus-visible:ring-success/30",
                          purchaseCodeError && "border-destructive"
                        )}
                      />
                      {purchaseCodeVerified ? (
                        <CheckCircle2 className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-success" />
                      ) : null}
                      {purchaseCodeError && !purchaseCodeVerified ? (
                        <XCircle className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive" />
                      ) : null}
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
                        "h-11 shrink-0 sm:min-w-[7rem]",
                        purchaseCodeVerified && "bg-success hover:bg-success/90"
                      )}
                    >
                      {isVerifyingPurchaseCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : purchaseCodeVerified ? (
                        <>
                          <CheckCircle2 className="me-2 h-4 w-4" />
                          {PUBLIC_TICKET_UI.verified}
                        </>
                      ) : (
                        "تحقق"
                      )}
                    </Button>
                  </div>
                  {purchaseCodeError ? (
                    <p className="text-sm text-destructive">{purchaseCodeError}</p>
                  ) : null}
                  {errors.purchaseCode ? (
                    <p className="text-sm text-destructive">
                      {errors.purchaseCode.message}
                    </p>
                  ) : null}
                </div>

                {envatoSettings.requirePurchaseCode &&
                !purchaseCodeVerified &&
                purchaseCode ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {PUBLIC_TICKET_UI.verifyRequired}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </FormSection>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 lg:self-start">
            <FormSection
              icon={<SlidersHorizontal className="h-4 w-4" />}
              title={PUBLIC_TICKET_UI.sections.details.title}
              description={PUBLIC_TICKET_UI.sections.details.description}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className={homeVisual.fieldLabel}>{TICKET_UI.priority}</Label>
                  <FieldHint>{PUBLIC_TICKET_UI.hints.priority}</FieldHint>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setValue("priority", value as TicketPriority)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-11 w-full bg-background/80">
                      <SelectValue placeholder={FORM_UI.selectPriority} />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex flex-col gap-0.5 py-0.5 text-start">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn("h-2 w-2 shrink-0 rounded-full", p.color)}
                              />
                              <span className="font-medium">{p.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{p.hint}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={homeVisual.fieldLabel}>{TICKET_UI.category}</Label>
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
                    <SelectTrigger className="h-11 w-full bg-background/80">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCategories ? (
                        <SelectItem value="general" disabled>
                          {UI.loading}
                        </SelectItem>
                      ) : categories.length === 0 ? (
                        <SelectItem value="general" disabled>
                          {PUBLIC_TICKET_UI.empty.categories}
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

                <div className="space-y-2">
                  <Label className={homeVisual.fieldLabel}>{TICKET_UI.department}</Label>
                  <Select
                    value={departmentSlug || ""}
                    onValueChange={(value) => setValue("departmentSlug", value)}
                    disabled={isSubmitting || loadingDepartments}
                  >
                    <SelectTrigger className="h-11 w-full bg-background/80">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingDepartments ? (
                        <SelectItem value="__loading" disabled>
                          {UI.loading}
                        </SelectItem>
                      ) : departments.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          {PUBLIC_TICKET_UI.empty.departments}
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

                <div className="space-y-2">
                  <Label className={homeVisual.fieldLabel}>{TICKET_UI.product}</Label>
                  <Select
                    value={productSlug || ""}
                    onValueChange={(value) => setValue("productSlug", value)}
                    disabled={isSubmitting || loadingProducts}
                  >
                    <SelectTrigger className="h-11 w-full bg-background/80">
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProducts ? (
                        <SelectItem value="__loading" disabled>
                          {UI.loading}
                        </SelectItem>
                      ) : products.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          {PUBLIC_TICKET_UI.empty.products}
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

                <div className="space-y-2">
                  <Label className={homeVisual.fieldLabel}>{FORM_UI.timezone}</Label>
                  <FieldHint>{PUBLIC_TICKET_UI.hints.timezone}</FieldHint>
                  <TimezoneSelect
                    value={timezone}
                    onValueChange={(value) => setValue("timezone", value)}
                    disabled={isSubmitting}
                    placeholder={FORM_UI.selectTimezone}
                    className="h-11 bg-background/80"
                  />
                </div>
              </div>
            </FormSection>

            <section
              className={cn(
                homeVisual.surface,
                "space-y-4 p-5 sm:p-6"
              )}
            >
              <header className="space-y-1 border-b border-border/45 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold">
                    {PUBLIC_TICKET_UI.sections.submit.title}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  {PUBLIC_TICKET_UI.sections.submit.description}
                </p>
              </header>
              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={
                  isSubmitting ||
                  (envatoSettings.requirePurchaseCode && !purchaseCodeVerified)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {PUBLIC_TICKET_UI.submitting}
                  </>
                ) : (
                  PUBLIC_TICKET_UI.submitTicket
                )}
              </Button>
              <Button asChild type="button" variant="outline" className="h-11 w-full">
                <Link href="/">{UI.cancel}</Link>
              </Button>
            </section>
          </aside>
        </div>
      </form>
    </div>
  );
}
