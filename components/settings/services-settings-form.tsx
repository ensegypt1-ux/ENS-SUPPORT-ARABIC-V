"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase,
  Bolt,
  Download,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Wrench,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PanelSectionHeader } from "@/components/ui/panel-form";
import { PageSectionLabel, RtlIconText, adminTableHeadClass } from "@/components/ui/arabic-ux";
import {
  adminTableShellClass,
  adminTableShellDir,
} from "@/components/ui/admin-table-shell";
import { cn } from "@/lib/utils";
import { SettingsFormCard } from "@/components/settings/settings-form-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createService, deleteService, updateService } from "@/actions/services";
import type { UserRole } from "@/types";

type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  href: string;
  iconKey: string;
  roles: UserRole[];
  isActive: boolean;
  sortOrder: number;
  description?: string;
};

const createServiceFormSchema = z.object({
  name: z.string().min(1, "اسم الخدمة مطلوب"),
  slug: z.string().optional(),
  iconKey: z.string().min(1, "الأيقونة مطلوبة"),
  description: z.string().optional(),
});

type CreateServiceFormData = z.infer<typeof createServiceFormSchema>;

const editServiceFormSchema = z.object({
  name: z.string().min(1, "اسم الخدمة مطلوب"),
  slug: z.string().min(1, "المعرّف مطلوب"),
  iconKey: z.string().min(1, "الأيقونة مطلوبة"),
  description: z.string().optional(),
});

type EditServiceFormData = z.infer<typeof editServiceFormSchema>;

const ICON_OPTIONS: Array<{
  key: string;
  label: string;
  Icon: React.ElementType;
}> = [
  { key: "briefcase", label: "حقيبة", Icon: Briefcase },
  { key: "wrench", label: "مفتاح", Icon: Wrench },
  { key: "download", label: "تنزيل", Icon: Download },
  { key: "package", label: "طرد", Icon: Package },
  { key: "bolt", label: "برق", Icon: Bolt },
];

function iconForKey(iconKey: string) {
  return ICON_OPTIONS.find((o) => o.key === iconKey)?.Icon ?? Briefcase;
}

export function ServicesSettingsForm({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<ServiceRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (byOrder !== 0) return byOrder;
      return a.name.localeCompare(b.name);
    });
  }, [services]);

  const createForm = useForm<CreateServiceFormData>({
    resolver: zodResolver(createServiceFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      iconKey: "briefcase",
      description: "",
    },
  });

  const editForm = useForm<EditServiceFormData>({
    resolver: zodResolver(editServiceFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      iconKey: "briefcase",
      description: "",
    },
  });

  const openEdit = (service: ServiceRow) => {
    setEditingService(service);
    editForm.reset({
      name: service.name,
      slug: service.slug,
      iconKey: service.iconKey || "briefcase",
      description: service.description || "",
    });
  };

  const handleCreate = async (data: CreateServiceFormData) => {
    setCreating(true);
    try {
      const result = await createService({
        name: data.name,
        slug: data.slug,
        iconKey: data.iconKey,
        description: data.description,
      });

      if (result.success) {
        toast.success("اتضاف الخدمة");
        createForm.reset({ name: "", slug: "", iconKey: "briefcase", description: "" });
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الإضافة الخدمة");
      }
    } catch {
      toast.error("تعذّر الإضافة الخدمة");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (service: ServiceRow, next: boolean) => {
    const result = await updateService({ id: service.id, isActive: next });
    if (result.success) {
      router.refresh();
      toast.success(next ? "اتفعّلت الخدمة" : "اتعطّلت الخدمة");
    } else {
      toast.error(result.error || "مقدرناش نحدّث الخدمة");
    }
  };

  const handleDelete = async (service: ServiceRow) => {
    setDeleting(true);
    try {
      const result = await deleteService(service.id);
      if (result.success) {
        router.refresh();
        toast.success("اتمسحت الخدمة");
      } else {
        toast.error(result.error || "تعذّر الحذف الخدمة");
      }
    } catch {
      toast.error("تعذّر الحذف الخدمة");
    } finally {
      setDeleting(false);
      setDeleteServiceTarget(null);
    }
  };

  const handleSaveEdit = async (data: EditServiceFormData) => {
    if (!editingService) return;
    setSavingEdit(true);
    try {
      const result = await updateService({
        id: editingService.id,
        name: data.name,
        slug: data.slug,
        iconKey: data.iconKey,
        description: data.description,
      });

      if (result.success) {
        toast.success("اتحدّثت الخدمة");
        setEditingService(null);
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث الخدمة");
      }
    } catch {
      toast.error("مقدرناش نحدّث الخدمة");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <SettingsFormCard
        icon={<Briefcase className="h-5 w-5 text-primary" />}
        iconWrapperClassName="rounded-lg"
        title="الخدمات"
        description="إنشاء وإدارة صفحات الخدمات المعروضة في الشريط الجانبي"
        contentClassName="space-y-8 pb-6"
      >
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4" dir="rtl">
            <PageSectionLabel>إضافة خدمة</PageSectionLabel>
            <div className="rounded-xl border bg-muted/20 p-5 space-y-5">
              <PanelSectionHeader
                title="خدمة جديدة"
                description="أضف خدمة لتظهر في الشريط الجانبي"
                actions={
                  <Button type="submit" disabled={creating} className="gap-2">
                    {creating ? (
                      <>
                        <span>جاري الإضافة...</span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>إضافة</span>
                        <Plus className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                }
              />

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 text-right">
                  <Label htmlFor="serviceName" className="text-sm font-medium">
                    اسم الخدمة
                  </Label>
                  <Input
                    id="serviceName"
                    placeholder="التثبيت"
                    className="h-11 bg-background/80 border-input/50 text-right focus:border-primary transition-colors"
                    {...createForm.register("name")}
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {createForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-right">
                  <Label htmlFor="serviceSlug" className="text-sm font-medium">
                    المعرّف (اختياري)
                  </Label>
                  <Input
                    id="serviceSlug"
                    placeholder="installation"
                    className="h-11 bg-background/80 border-input/50 text-right focus:border-primary transition-colors"
                    {...createForm.register("slug")}
                  />
                </div>

                <div className="space-y-2 text-right">
                  <Label className="text-sm font-medium">الأيقونة</Label>
                  <Select
                    value={createForm.watch("iconKey")}
                    onValueChange={(value) => createForm.setValue("iconKey", value)}
                  >
                    <SelectTrigger className="h-11 bg-background/80 border-input/50 text-right">
                      <SelectValue placeholder="اختر أيقونة" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(({ key, label, Icon }) => (
                        <SelectItem key={key} value={key}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2 text-right">
                  <Label htmlFor="serviceDescription" className="text-sm font-medium">
                    الوصف (اختياري)
                  </Label>
                  <Textarea
                    id="serviceDescription"
                    placeholder="صِف الغرض من هذه الخدمة..."
                    rows={3}
                    className="bg-background/80 border-input/50 text-right focus:border-primary transition-colors resize-none"
                    {...createForm.register("description")}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-right">
                ستُفتح الخدمات الجديدة على{" "}
                <span className="font-medium">/admin/services/&lt;slug&gt;</span>.
              </p>
            </div>
          </form>

          <div className="space-y-4" dir="rtl">
            <PanelSectionHeader title="الخدمات الحالية" />
            <div className={adminTableShellClass()} style={adminTableShellDir}>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 bg-muted/20 hover:bg-muted/20">
                    <TableHead className={cn(adminTableHeadClass, "w-[140px]")} dir="rtl">
                      الإجراءات
                    </TableHead>
                    <TableHead className={adminTableHeadClass} dir="rtl">
                      نشط
                    </TableHead>
                    <TableHead className={adminTableHeadClass} dir="rtl">
                      المسار
                    </TableHead>
                    <TableHead className={adminTableHeadClass} dir="rtl">
                      المعرّف
                    </TableHead>
                    <TableHead className={adminTableHeadClass} dir="rtl">
                      الخدمة
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-background/50">
                  {sortedServices.map((service) => {
                    const Icon = iconForKey(service.iconKey);
                    return (
                      <TableRow
                        key={service.id}
                        className="border-b border-border/30 hover:bg-muted/30 transition-all duration-200"
                      >
                        <TableCell className="py-3.5 px-4" dir="rtl">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEdit(service)}
                            >
                              <span>تعديل</span>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => setDeleteServiceTarget(service)}
                            >
                              <span>حذف</span>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-4" dir="rtl">
                          <Switch
                            checked={service.isActive}
                            onCheckedChange={(next) => handleToggleActive(service, next)}
                          />
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                          {`/admin/services/${service.slug}`}
                        </TableCell>
                        <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                          {service.slug}
                        </TableCell>
                        <TableCell className="py-3.5 px-4" dir="rtl">
                          <RtlIconText
                            icon={
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            }
                          >
                            <span className="font-medium">{service.name}</span>
                          </RtlIconText>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {sortedServices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                        مفيش خدمات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
      </SettingsFormCard>

      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تعديل الخدمة</DialogTitle>
            <DialogDescription>تحديث معلومات الخدمة ورابط الشريط الجانبي.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">الاسم</Label>
                <Input {...editForm.register("name")} className="h-11" />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">المعرّف</Label>
                <Input {...editForm.register("slug")} className="h-11" />
                {editForm.formState.errors.slug && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">الأيقونة</Label>
                <Select
                  value={editForm.watch("iconKey")}
                  onValueChange={(value) => editForm.setValue("iconKey", value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر أيقونة" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(({ key, label, Icon }) => (
                      <SelectItem key={key} value={key}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">الوصف</Label>
                <Textarea rows={4} {...editForm.register("description")} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingService(null)} disabled={savingEdit}>
                إلغاء
              </Button>
              <Button type="submit" disabled={savingEdit} className="gap-2">
                {savingEdit ? (
                  <>
                    <span>بيتحفظ...</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>حفظ</span>
                    <Save className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteServiceTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteServiceTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الخدمة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيؤدي هذا إلى حذف{" "}
              <span className="font-medium text-foreground">
                {deleteServiceTarget?.name}
              </span>{" "}
              نهائياً. مش هينفع الرجوع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting || !deleteServiceTarget}
              onClick={(e) => {
                e.preventDefault();
                if (!deleteServiceTarget) return;
                void handleDelete(deleteServiceTarget);
              }}
            >
              {deleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
