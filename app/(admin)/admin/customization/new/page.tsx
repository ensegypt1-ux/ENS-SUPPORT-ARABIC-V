"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { adminCreateTicket } from "@/actions/admin";
import { getClientUsers } from "@/actions/admin";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCreateTicketFormData, User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminCreateTicketSchema } from "@/lib/validations";
import { uploadTicketAttachments } from "@/actions/attachments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wrench, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { FileUploadPreview } from "@/components/attachments/file-upload-preview";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import {
  FormSectionTitle,
  LocalSearchField,
} from "@/components/ui/arabic-ux";
import { FORM_UI, PRIORITY_FORM_LABELS, UI } from "@/lib/strings";
import { cn } from "@/lib/utils";

type ClientUser = User & {
  ticketCount: number;
  openTickets: number;
  resolvedTickets: number;
  lastTicketDate?: Date;
};

export default function AdminNewCustomizationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customers, setCustomers] = useState<ClientUser[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdminCreateTicketFormData>({
    resolver: zodResolver(adminCreateTicketSchema),
    defaultValues: {
      priority: "medium",
      category: "feature_request",
    },
  });

  const priority = watch("priority");
  const timezone = watch("timezone");
  const customerId = watch("customerId");

  useEffect(() => {
    async function loadCustomers() {
      setIsLoadingCustomers(true);
      const result = await getClientUsers();
      if (result.success && result.data) {
        setCustomers(result.data);
      }
      setIsLoadingCustomers(false);
    }
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const onSubmit = async (data: AdminCreateTicketFormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await adminCreateTicket({
        ...data,
        category: "feature_request",
      });

      if (!result.success) {
        setError(result.error || FORM_UI.createFailed);
        toast.error(result.error || FORM_UI.createFailed);
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
            `${FORM_UI.uploadPartialFail}: ${uploadResult.error}`
          );
        } else if (uploadResult.data && uploadResult.data.length > 0) {
          toast.success(
            `${FORM_UI.createSuccess} (${uploadResult.data.length} ${FORM_UI.attachmentWord})`
          );
        } else {
          toast.success(FORM_UI.createSuccess);
        }
      } else {
        toast.success(FORM_UI.createSuccess);
      }

      router.push(`/admin/customization/${ticketId}`);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : FORM_UI.unexpectedError;
      setError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const priorities = (
    ["low", "medium", "high", "urgent"] as const
  ).map((value) => ({
    value,
    label: PRIORITY_FORM_LABELS[value],
    color:
      value === "low"
        ? "bg-slate-400"
        : value === "medium"
          ? "bg-blue-500"
          : value === "high"
            ? "bg-amber-500"
            : "bg-red-500",
  }));

  return (
    <div className="min-h-screen bg-muted/30 text-start">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between pb-6 pt-2">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground">
                {FORM_UI.createCustomizationTitle}
              </h1>
              <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href="/admin"
                  className="transition-colors hover:text-foreground"
                >
                  {FORM_UI.adminBreadcrumb}
                </Link>
                <span aria-hidden="true">•</span>
                <Link
                  href="/admin/customization"
                  className="transition-colors hover:text-foreground"
                >
                  {FORM_UI.customizationBreadcrumb}
                </Link>
                <span aria-hidden="true">•</span>
                <span className="text-foreground">
                  {FORM_UI.newRequestBreadcrumb}
                </span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form id="customization-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="space-y-4 rounded-xl border bg-background p-6">
                <FormSectionTitle
                  icon={<Users className="h-5 w-5 text-primary" />}
                  title={FORM_UI.selectCustomer}
                  description={FORM_UI.selectCustomerHint}
                />

                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-3">
                      <LocalSearchField
                        className="sm:col-span-2"
                        value={customerSearch}
                        onChange={setCustomerSearch}
                        placeholder={FORM_UI.searchCustomers}
                        disabled={isSubmitting}
                      />

                      <Select
                        value={customerId}
                        onValueChange={(value) => setValue("customerId", value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-11 min-h-11 w-full">
                          <SelectValue
                            placeholder={FORM_UI.selectCustomerPlaceholder}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex flex-col text-start">
                                <span className="font-medium">
                                  {customer.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {customer.email}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                          {filteredCustomers.length === 0 && (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              {FORM_UI.noCustomersFound}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCustomer && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-sm font-medium">
                          {selectedCustomer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCustomer.email} •{" "}
                          {selectedCustomer.ticketCount} {FORM_UI.ticketsCount}
                        </p>
                      </div>
                    )}

                    {errors.customerId && (
                      <p className="text-sm text-destructive">
                        {errors.customerId.message}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-6 rounded-xl border bg-background p-6">
                <h2 className="text-lg font-semibold">
                  {FORM_UI.customizationDetails}
                </h2>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    {FORM_UI.requestTitle}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={FORM_UI.customizationTitlePlaceholder}
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

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {FORM_UI.requirements}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={FORM_UI.requirementsPlaceholder}
                    {...register("description")}
                    disabled={isSubmitting}
                    className="min-h-[120px] resize-none placeholder:text-muted-foreground/50"
                  />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {FORM_UI.securityNote}
                  </p>
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {process.env.NEXT_PUBLIC_FILE_UPLOADS_ENABLED === "true" && (
                <div className="space-y-4 rounded-xl border bg-background p-6">
                  <h2 className="text-lg font-semibold">{FORM_UI.attachments}</h2>
                  <p className="text-xs text-muted-foreground">
                    {FORM_UI.attachmentsHint}
                  </p>
                  <FileUploadPreview
                    onFilesChange={handleFilesChange}
                    disabled={isSubmitting}
                    maxFiles={5}
                    maxFileSize={20971520}
                  />
                </div>
              )}

              {process.env.NEXT_PUBLIC_PURCHASE_CODE_VALIDATION_ENABLED ===
                "true" && (
                <div className="space-y-6 rounded-xl border bg-background p-6">
                  <FormSectionTitle
                    title={
                      <>
                        {FORM_UI.productInfo}{" "}
                        <span className="text-destructive">*</span>
                      </>
                    }
                    description={FORM_UI.productInfoHint}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="productName">{FORM_UI.productName}</Label>
                      <Input
                        id="productName"
                        placeholder={FORM_UI.productNamePlaceholder}
                        {...register("productName")}
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productVersion">
                        {FORM_UI.productVersion}
                      </Label>
                      <Input
                        id="productVersion"
                        placeholder={FORM_UI.productVersionPlaceholder}
                        {...register("productVersion")}
                        disabled={isSubmitting}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseCode">{FORM_UI.purchaseCode}</Label>
                    <Input
                      id="purchaseCode"
                      placeholder={FORM_UI.purchaseCodePlaceholder}
                      {...register("purchaseCode")}
                      disabled={isSubmitting}
                      className="h-11 font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      {FORM_UI.purchaseCodeHint}
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

            <div className="space-y-6">
              <div className="space-y-4 rounded-xl border bg-background p-6">
                <div className="flex flex-row items-center justify-between">
                  <h2 className="text-lg font-semibold">{FORM_UI.priority}</h2>
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
                <p className="text-xs text-muted-foreground">
                  {FORM_UI.priorityHint}
                </p>
                {errors.priority && (
                  <p className="text-sm text-destructive">
                    {errors.priority.message}
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-xl border bg-background p-6">
                <h2 className="text-lg font-semibold">{FORM_UI.timezone}</h2>
                <TimezoneSelect
                  value={timezone}
                  onValueChange={(value) => setValue("timezone", value)}
                  disabled={isSubmitting}
                  placeholder={FORM_UI.selectTimezone}
                />
                <p className="text-xs text-muted-foreground">
                  {FORM_UI.timezoneHint}
                </p>
              </div>

              <div className="space-y-3 rounded-xl border bg-background p-6">
                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={isSubmitting || !customerId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" />
                      {FORM_UI.creating}
                    </>
                  ) : (
                    FORM_UI.createRequest
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full"
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
    </div>
  );
}
