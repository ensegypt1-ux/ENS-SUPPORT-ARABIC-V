"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { SystemSettings } from "@/types/settings";
import { updateSettings } from "@/actions/settings";
import { Loader2, Plus, Save, Ticket, Trash2, Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageSectionLabel, adminTableHeadClass } from "@/components/ui/arabic-ux";
import {
  adminTableShellClass,
  adminTableShellDir,
} from "@/components/ui/admin-table-shell";
import { cn } from "@/lib/utils";
import {
  SettingsFormCard,
  SettingsSaveBar,
} from "@/components/settings/settings-form-shell";
import {
  PanelSectionHeader,
  PanelSwitchField,
} from "@/components/ui/panel-form";
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
  DialogDescription as DialogDescriptionBase,
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
  createTicketCategory,
  deleteTicketCategory,
  getTicketCategories,
  updateTicketCategory,
} from "@/actions/ticket-categories";
import {
  createTicketDepartment,
  deleteTicketDepartment,
  getTicketDepartments,
  updateTicketDepartment,
} from "@/actions/ticket-departments";
import {
  createTicketProduct,
  deleteTicketProduct,
  getTicketProducts,
  updateTicketProduct,
} from "@/actions/ticket-products";
import { PRIORITY_LABELS } from "@/lib/strings";

const ticketSettingsSchema = z.object({
  ticketNumberPrefix: z.string().min(1, "البادئة مطلوبة"),
  defaultPriority: z.enum(["low", "medium", "high", "urgent"]),
  autoCloseResolvedTicketsDays: z.number().min(0).max(365),
  allowCustomerCloseTickets: z.boolean(),
  requirePurchaseCode: z.boolean(),
  enableInternalNotes: z.boolean(),
  enableTicketTags: z.boolean(),
});

type TicketSettingsFormData = z.infer<typeof ticketSettingsSchema>;

interface TicketSettingsFormProps {
  settings: SystemSettings;
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
};

type DepartmentRow = CategoryRow;
type ProductRow = CategoryRow;

const createCategorySchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب"),
  slug: z.string().optional(),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

const editCategorySchema = z.object({
  name: z.string().min(1, "اسم الفئة مطلوب"),
  slug: z.string().min(1, "المعرّف مطلوب").optional(),
  sortOrder: z.number().min(0).max(1000),
  isActive: z.boolean(),
});

type EditCategoryFormData = z.infer<typeof editCategorySchema>;

const createDepartmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  slug: z.string().optional(),
});

type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>;

const editDepartmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب"),
  slug: z.string().min(1, "المعرّف مطلوب").optional(),
  sortOrder: z.number().min(0).max(1000),
  isActive: z.boolean(),
});

type EditDepartmentFormData = z.infer<typeof editDepartmentSchema>;

const createProductSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  slug: z.string().optional(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

const editProductSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  slug: z.string().min(1, "المعرّف مطلوب").optional(),
  sortOrder: z.number().min(0).max(1000),
  isActive: z.boolean(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

export function TicketSettingsForm({ settings }: TicketSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryRow | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState("");
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRow | null>(null);
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [togglingDepartmentId, setTogglingDepartmentId] = useState<string | null>(null);
  const [deleteDepartmentTarget, setDeleteDepartmentTarget] =
    useState<DepartmentRow | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState(false);

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<ProductRow | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TicketSettingsFormData>({
    resolver: zodResolver(ticketSettingsSchema),
    defaultValues: settings.tickets,
  });

  const createCategoryForm = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "", slug: "" },
  });

  const editCategoryForm = useForm<EditCategoryFormData>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: { name: "", slug: "", sortOrder: 100, isActive: true },
  });

  const createDepartmentForm = useForm<CreateDepartmentFormData>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: { name: "", slug: "" },
  });

  const editDepartmentForm = useForm<EditDepartmentFormData>({
    resolver: zodResolver(editDepartmentSchema),
    defaultValues: { name: "", slug: "", sortOrder: 100, isActive: true },
  });

  const createProductForm = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: "", slug: "" },
  });

  const editProductForm = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: { name: "", slug: "", sortOrder: 100, isActive: true },
  });

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (byOrder !== 0) return byOrder;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  const refreshCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError("");
    try {
      const result = await getTicketCategories();
      if (!result.success || !result.data) {
        setCategoriesError(result.error || "تعذّر التحميل الفئات");
        setCategories([]);
      } else {
        setCategories(result.data);
      }
    } catch (e) {
      setCategoriesError(e instanceof Error ? e.message : "تعذّر التحميل الفئات");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    void refreshCategories();
  }, []);

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => {
      const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (byOrder !== 0) return byOrder;
      return a.name.localeCompare(b.name);
    });
  }, [departments]);

  const refreshDepartments = async () => {
    setDepartmentsLoading(true);
    setDepartmentsError("");
    try {
      const result = await getTicketDepartments();
      if (!result.success || !result.data) {
        setDepartmentsError(result.error || "تعذّر التحميل الأقسام");
        setDepartments([]);
      } else {
        setDepartments(result.data);
      }
    } catch (e) {
      setDepartmentsError(
        e instanceof Error ? e.message : "تعذّر التحميل الأقسام",
      );
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    void refreshDepartments();
  }, []);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const byOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (byOrder !== 0) return byOrder;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  const refreshProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const result = await getTicketProducts();
      if (!result.success || !result.data) {
        setProductsError(result.error || "تعذّر التحميل المنتجات");
        setProducts([]);
      } else {
        setProducts(result.data);
      }
    } catch (e) {
      setProductsError(
        e instanceof Error ? e.message : "تعذّر التحميل المنتجات",
      );
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    void refreshProducts();
  }, []);

  const onSubmit = async (data: TicketSettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        tickets: data,
      });

      if (result.success) {
        toast.success("اتحدّثت إعدادات التذاكر");
      } else {
        toast.error(result.error || "مقدرناش نحدّث الإعدادات");
      }
    } catch (error) {
      toast.error("حصل خطأ وإحنا بنحدّث الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateCategory = async (data: CreateCategoryFormData) => {
    setCreatingCategory(true);
    try {
      const result = await createTicketCategory({
        name: data.name,
        slug: data.slug,
      });
      if (result.success) {
        toast.success("اتضاف الفئة");
        createCategoryForm.reset({ name: "", slug: "" });
        setAddCategoryOpen(false);
        await refreshCategories();
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الإضافة الفئة");
      }
    } catch {
      toast.error("تعذّر الإضافة الفئة");
    } finally {
      setCreatingCategory(false);
    }
  };

  const openEditCategory = (category: CategoryRow) => {
    setEditingCategory(category);
    editCategoryForm.reset({
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive,
    });
  };

  const onSaveCategory = async (data: EditCategoryFormData) => {
    if (!editingCategory) return;
    setSavingCategory(true);
    try {
      const payload: {
        id: string;
        name: string;
        sortOrder: number;
        isActive: boolean;
        slug?: string;
      } = {
        id: editingCategory.id,
        name: data.name,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      };
      if (!editingCategory.isSystem) payload.slug = data.slug;
      const result = await updateTicketCategory(payload);
      if (result.success) {
        toast.success("اتحدّثت الفئة");
        setEditingCategory(null);
        await refreshCategories();
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث الفئة");
      }
    } catch {
      toast.error("مقدرناش نحدّث الفئة");
    } finally {
      setSavingCategory(false);
    }
  };

  const onConfirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setDeletingCategory(true);
    try {
      const result = await deleteTicketCategory(deleteCategoryTarget.id);
      if (result.success) {
        toast.success("اتمسحت الفئة");
        setDeleteCategoryTarget(null);
        await refreshCategories();
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الحذف الفئة");
      }
    } catch {
      toast.error("تعذّر الحذف الفئة");
    } finally {
      setDeletingCategory(false);
    }
  };

  const onToggleCategoryActive = async (category: CategoryRow, next: boolean) => {
    setTogglingCategoryId(category.id);
    try {
      const result = await updateTicketCategory({ id: category.id, isActive: next });
      if (result.success) {
        toast.success(next ? "اتفعّلت الفئة" : "اتعطّلت الفئة");
        await refreshCategories();
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث الفئة");
      }
    } catch {
      toast.error("مقدرناش نحدّث الفئة");
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const onCreateDepartment = async (data: CreateDepartmentFormData) => {
    setCreatingDepartment(true);
    try {
      const result = await createTicketDepartment({
        name: data.name,
        slug: data.slug,
      });
      if (result.success) {
        toast.success("اتضاف القسم");
        createDepartmentForm.reset({ name: "", slug: "" });
        setAddDepartmentOpen(false);
        await refreshDepartments();
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الإضافة القسم");
      }
    } catch {
      toast.error("تعذّر الإضافة القسم");
    } finally {
      setCreatingDepartment(false);
    }
  };

  const openEditDepartment = (department: DepartmentRow) => {
    setEditingDepartment(department);
    editDepartmentForm.reset({
      name: department.name,
      slug: department.slug,
      sortOrder: department.sortOrder ?? 0,
      isActive: department.isActive,
    });
  };

  const onSaveDepartment = async (data: EditDepartmentFormData) => {
    if (!editingDepartment) return;
    setSavingDepartment(true);
    try {
      const payload: {
        id: string;
        name: string;
        sortOrder: number;
        isActive: boolean;
        slug?: string;
      } = {
        id: editingDepartment.id,
        name: data.name,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      };
      if (!editingDepartment.isSystem) payload.slug = data.slug;
      const result = await updateTicketDepartment(payload);
      if (result.success) {
        toast.success("اتحدّث القسم");
        setEditingDepartment(null);
        await refreshDepartments();
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث القسم");
      }
    } catch {
      toast.error("مقدرناش نحدّث القسم");
    } finally {
      setSavingDepartment(false);
    }
  };

  const onConfirmDeleteDepartment = async () => {
    if (!deleteDepartmentTarget) return;
    setDeletingDepartment(true);
    try {
      const result = await deleteTicketDepartment(deleteDepartmentTarget.id);
      if (result.success) {
        toast.success("اتمسح القسم");
        setDeleteDepartmentTarget(null);
        await refreshDepartments();
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الحذف القسم");
      }
    } catch {
      toast.error("تعذّر الحذف القسم");
    } finally {
      setDeletingDepartment(false);
    }
  };

  const onToggleDepartmentActive = async (
    department: DepartmentRow,
    next: boolean,
  ) => {
    setTogglingDepartmentId(department.id);
    try {
      const result = await updateTicketDepartment({
        id: department.id,
        isActive: next,
      });
      if (result.success) {
        toast.success(next ? "اتفعّل القسم" : "اتعطّل القسم");
        await refreshDepartments();
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث القسم");
      }
    } catch {
      toast.error("مقدرناش نحدّث القسم");
    } finally {
      setTogglingDepartmentId(null);
    }
  };

  const onCreateProduct = async (data: CreateProductFormData) => {
    setCreatingProduct(true);
    try {
      const result = await createTicketProduct({
        name: data.name,
        slug: data.slug,
      });
      if (result.success) {
        toast.success("اتضاف المنتج");
        createProductForm.reset({ name: "", slug: "" });
        setAddProductOpen(false);
        await refreshProducts();
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الإضافة المنتج");
      }
    } catch {
      toast.error("تعذّر الإضافة المنتج");
    } finally {
      setCreatingProduct(false);
    }
  };

  const openEditProduct = (product: ProductRow) => {
    setEditingProduct(product);
    editProductForm.reset({
      name: product.name,
      slug: product.slug,
      sortOrder: product.sortOrder ?? 0,
      isActive: product.isActive,
    });
  };

  const onSaveProduct = async (data: EditProductFormData) => {
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const payload: {
        id: string;
        name: string;
        sortOrder: number;
        isActive: boolean;
        slug?: string;
      } = {
        id: editingProduct.id,
        name: data.name,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      };
      if (!editingProduct.isSystem) payload.slug = data.slug;
      const result = await updateTicketProduct(payload);
      if (result.success) {
        toast.success("اتحدّث المنتج");
        setEditingProduct(null);
        await refreshProducts();
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث المنتج");
      }
    } catch {
      toast.error("مقدرناش نحدّث المنتج");
    } finally {
      setSavingProduct(false);
    }
  };

  const onConfirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setDeletingProduct(true);
    try {
      const result = await deleteTicketProduct(deleteProductTarget.id);
      if (result.success) {
        toast.success("اتمسح المنتج");
        setDeleteProductTarget(null);
        await refreshProducts();
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الحذف المنتج");
      }
    } catch {
      toast.error("تعذّر الحذف المنتج");
    } finally {
      setDeletingProduct(false);
    }
  };

  const onToggleProductActive = async (
    product: ProductRow,
    next: boolean,
  ) => {
    setTogglingProductId(product.id);
    try {
      const result = await updateTicketProduct({
        id: product.id,
        isActive: next,
      });
      if (result.success) {
        toast.success(next ? "اتفعّل المنتج" : "اتعطّل المنتج");
        await refreshProducts();
        router.refresh();
      } else {
        toast.error(result.error || "مقدرناش نحدّث المنتج");
      }
    } catch {
      toast.error("مقدرناش نحدّث المنتج");
    } finally {
      setTogglingProductId(null);
    }
  };

  return (
    <SettingsFormCard
      icon={<Ticket className="h-5 w-5 text-orange-500" />}
      iconWrapperClassName="rounded-md bg-orange-500/10"
      title="إعدادات التذاكر"
      description="اضبط كيفية إنشاء التذاكر وإدارتها"
      contentClassName="pb-6 space-y-8"
    >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
          {/* Ticket Configuration Section */}
          <div className="space-y-4">
            <PageSectionLabel>تهيئة التذاكر</PageSectionLabel>
            <div className="rounded-xl border bg-muted/20 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Ticket Number Prefix */}
                <div className="space-y-2">
                  <Label
                    htmlFor="ticketNumberPrefix"
                    className="text-sm font-medium"
                  >
                    بادئة رقم التذكرة
                  </Label>
                  <Input
                    id="ticketNumberPrefix"
                    {...register("ticketNumberPrefix")}
                    placeholder="TICKET"
                    className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">
                    مثال: TICKET-0001، TICKET-0002، وغيرها.
                  </p>
                  {errors.ticketNumberPrefix && (
                    <p className="text-sm text-destructive">
                      {errors.ticketNumberPrefix.message}
                    </p>
                  )}
                </div>

                {/* Default Priority */}
                <div className="space-y-2">
                  <Label
                    htmlFor="defaultPriority"
                    className="text-sm font-medium"
                  >
                    الأولوية الافتراضية
                  </Label>
                  <Select
                    value={watch("defaultPriority")}
                    onValueChange={(value: string) =>
                      setValue(
                        "defaultPriority",
                        value as "low" | "medium" | "high" | "urgent"
                      )
                    }
                  >
                    <SelectTrigger className="h-11 bg-background/80 border-input/50">
                      <SelectValue placeholder="اختر الأولوية الافتراضية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{PRIORITY_LABELS.low}</SelectItem>
                      <SelectItem value="medium">{PRIORITY_LABELS.medium}</SelectItem>
                      <SelectItem value="high">{PRIORITY_LABELS.high}</SelectItem>
                      <SelectItem value="urgent">{PRIORITY_LABELS.urgent}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.defaultPriority && (
                    <p className="text-sm text-destructive">
                      {errors.defaultPriority.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Auto Close Resolved Tickets */}
              <div className="mt-5 space-y-2">
                <Label
                  htmlFor="autoCloseResolvedTicketsDays"
                  className="text-sm font-medium"
                >
                  إغلاق التذاكر المحلولة تلقائياً (بالأيام)
                </Label>
                <Input
                  id="autoCloseResolvedTicketsDays"
                  type="number"
                  {...register("autoCloseResolvedTicketsDays", {
                    valueAsNumber: true,
                  })}
                  placeholder="7"
                  className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  إغلاق التذاكر تلقائياً بعد مرور هذا العدد من الأيام على
                  حلّها. اضبط على 0 للتعطيل.
                </p>
                {errors.autoCloseResolvedTicketsDays && (
                  <p className="text-sm text-destructive">
                    {errors.autoCloseResolvedTicketsDays.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Feature Toggles Section */}
          <div className="space-y-4 mb-0">
            <PageSectionLabel>ميزات اختيارية</PageSectionLabel>
            <div className="space-y-3">
              <PanelSwitchField
                label="السماح للعملاء بإغلاق التذاكر"
                description="السماح للعملاء بإغلاق تذاكرهم"
                control={
                  <Switch
                    id="allowCustomerCloseTickets"
                    checked={watch("allowCustomerCloseTickets")}
                    onCheckedChange={(checked) =>
                      setValue("allowCustomerCloseTickets", checked)
                    }
                  />
                }
              />

              <PanelSwitchField
                label="طلب رمز الشراء"
                description="إلزام العملاء بتقديم رمز شراء صالح عند إنشاء التذاكر"
                control={
                  <Switch
                    id="requirePurchaseCode"
                    checked={watch("requirePurchaseCode")}
                    onCheckedChange={(checked) =>
                      setValue("requirePurchaseCode", checked)
                    }
                  />
                }
              />

              <PanelSwitchField
                label="تفعيل الملاحظات الداخلية"
                description="السماح لفريق الدعم بإضافة ملاحظات خاصة لا يراها العملاء"
                control={
                  <Switch
                    id="enableInternalNotes"
                    checked={watch("enableInternalNotes")}
                    onCheckedChange={(checked) =>
                      setValue("enableInternalNotes", checked)
                    }
                  />
                }
              />

              <PanelSwitchField
                label="تفعيل وسوم التذاكر"
                description="السماح بإضافة وسوم مخصصة للتذاكر لتنظيم أفضل"
                control={
                  <Switch
                    id="enableTicketTags"
                    checked={watch("enableTicketTags")}
                    onCheckedChange={(checked) =>
                      setValue("enableTicketTags", checked)
                    }
                  />
                }
              />
            </div>
          </div>

          <SettingsSaveBar isLoading={isLoading} />
        </form>

        <div className="space-y-4" dir="rtl">
          <PageSectionLabel>فئات التذاكر</PageSectionLabel>

          <div className="rounded-xl border bg-muted/20 p-5">
            <PanelSectionHeader
              title="الفئات"
              description="أضف فئات مخصصة لإنشاء التذاكر"
              actions={
                <Button type="button" onClick={() => setAddCategoryOpen(true)} className="gap-2">
                  <span>إضافة فئة</span>
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>

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
                    الترتيب
                  </TableHead>
                  <TableHead className={adminTableHeadClass} dir="rtl">
                    المعرّف
                  </TableHead>
                  <TableHead className={adminTableHeadClass} dir="rtl">
                    الاسم
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-background/50">
                {categoriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                      جاري تحميل الفئات...
                    </TableCell>
                  </TableRow>
                ) : categoriesError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-destructive" dir="rtl">
                      {categoriesError}
                    </TableCell>
                  </TableRow>
                ) : sortedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                      ملقيناش فئات
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCategories.map((cat) => (
                    <TableRow
                      key={cat.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-all duration-200"
                    >
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditCategory(cat)}
                          >
                            <span>تعديل</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            disabled={cat.isSystem}
                            onClick={() => setDeleteCategoryTarget(cat)}
                          >
                            <span>حذف</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <Switch
                          checked={cat.isActive}
                          disabled={togglingCategoryId === cat.id}
                          onCheckedChange={(next) => onToggleCategoryActive(cat, next)}
                        />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                        {cat.sortOrder ?? 0}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <div className="font-medium">{cat.name}</div>
                        {cat.isSystem && (
                          <div className="text-xs text-muted-foreground">نظام</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4 mt-8" dir="rtl">
          <PageSectionLabel>أقسام التذاكر</PageSectionLabel>

          <div className="rounded-xl border bg-muted/20 p-5">
            <PanelSectionHeader
              title="الأقسام"
              description="أضف أقساماً لتوجيه التذاكر إلى الفريق المناسب"
              actions={
                <Button type="button" onClick={() => setAddDepartmentOpen(true)} className="gap-2">
                  <span>إضافة قسم</span>
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>

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
                    الترتيب
                  </TableHead>
                  <TableHead className={adminTableHeadClass} dir="rtl">
                    المعرّف
                  </TableHead>
                  <TableHead className={adminTableHeadClass} dir="rtl">
                    الاسم
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-background/50">
                {departmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                      جاري تحميل الأقسام...
                    </TableCell>
                  </TableRow>
                ) : departmentsError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-destructive" dir="rtl">
                      {departmentsError}
                    </TableCell>
                  </TableRow>
                ) : sortedDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                      ملقيناش أقسام
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedDepartments.map((dept) => (
                    <TableRow
                      key={dept.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-all duration-200"
                    >
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditDepartment(dept)}
                          >
                            <span>تعديل</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            disabled={dept.isSystem}
                            onClick={() => setDeleteDepartmentTarget(dept)}
                          >
                            <span>حذف</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <Switch
                          checked={dept.isActive}
                          disabled={togglingDepartmentId === dept.id}
                          onCheckedChange={(next) => onToggleDepartmentActive(dept, next)}
                        />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                        {dept.sortOrder ?? 0}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                        {dept.slug}
                      </TableCell>
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <div className="font-medium">{dept.name}</div>
                        {dept.isSystem && (
                          <div className="text-xs text-muted-foreground">نظام</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4 mt-8" dir="rtl">
          <PageSectionLabel>منتجات التذاكر</PageSectionLabel>

          <div className="rounded-xl border bg-muted/20 p-5">
            <PanelSectionHeader
              title="المنتجات"
              description="أضف منتجات يمكن للعملاء اختيارها عند افتح تذكرة"
              actions={
                <Button type="button" onClick={() => setAddProductOpen(true)} className="gap-2">
                  <span>إضافة منتج</span>
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>

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
                    الترتيب
                  </TableHead>
                  <TableHead className={adminTableHeadClass} dir="rtl">
                    المعرّف
                  </TableHead>
                  <TableHead className={adminTableHeadClass} dir="rtl">
                    الاسم
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-background/50">
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                      جاري تحميل المنتجات...
                    </TableCell>
                  </TableRow>
                ) : productsError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-destructive" dir="rtl">
                      {productsError}
                    </TableCell>
                  </TableRow>
                ) : sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground" dir="rtl">
                      ملقيناش منتجات
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((prod) => (
                    <TableRow
                      key={prod.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-all duration-200"
                    >
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditProduct(prod)}
                          >
                            <span>تعديل</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            disabled={prod.isSystem}
                            onClick={() => setDeleteProductTarget(prod)}
                          >
                            <span>حذف</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <Switch
                          checked={prod.isActive}
                          disabled={togglingProductId === prod.id}
                          onCheckedChange={(next) => onToggleProductActive(prod, next)}
                        />
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                        {prod.sortOrder ?? 0}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-muted-foreground" dir="rtl">
                        {prod.slug}
                      </TableCell>
                      <TableCell className="py-3.5 px-4" dir="rtl">
                        <div className="font-medium">{prod.name}</div>
                        {prod.isSystem && (
                          <div className="text-xs text-muted-foreground">نظام</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog
          open={addCategoryOpen}
          onOpenChange={(open) => {
            if (!open && !creatingCategory) {
              setAddCategoryOpen(false);
              createCategoryForm.reset({ name: "", slug: "" });
            } else {
              setAddCategoryOpen(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إضافة فئة</DialogTitle>
              <DialogDescriptionBase>
                أنشئ فئة تذكرة جديدة. ستظهر في قوائم إنشاء التذاكر.
              </DialogDescriptionBase>
            </DialogHeader>

            <form
              onSubmit={createCategoryForm.handleSubmit(onCreateCategory)}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم</Label>
                  <Input
                    className="h-11"
                    {...createCategoryForm.register("name")}
                    disabled={creatingCategory}
                  />
                  {createCategoryForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {createCategoryForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المعرّف (اختياري)</Label>
                  <Input
                    className="h-11"
                    {...createCategoryForm.register("slug")}
                    disabled={creatingCategory}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddCategoryOpen(false)}
                  disabled={creatingCategory}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={creatingCategory} className="gap-2">
                  {creatingCategory ? (
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
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>تعديل الفئة</DialogTitle>
              <DialogDescriptionBase>تحديث اسم الفئة والمعرّف والترتيب وحالة النشاط.</DialogDescriptionBase>
            </DialogHeader>
            <form onSubmit={editCategoryForm.handleSubmit(onSaveCategory)} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم</Label>
                  <Input {...editCategoryForm.register("name")} className="h-11" />
                  {editCategoryForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{editCategoryForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المعرّف</Label>
                  <Input
                    {...editCategoryForm.register("slug")}
                    className="h-11"
                    disabled={!!editingCategory?.isSystem}
                  />
                  {editCategoryForm.formState.errors.slug && (
                    <p className="text-sm text-destructive">{editCategoryForm.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ترتيب العرض</Label>
                  <Input
                    type="number"
                    className="h-11"
                    {...editCategoryForm.register("sortOrder", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نشط</Label>
                  <div className="h-11 flex items-center">
                    <Switch
                      checked={editCategoryForm.watch("isActive")}
                      onCheckedChange={(checked) => editCategoryForm.setValue("isActive", checked)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                  disabled={savingCategory}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={savingCategory} className="gap-2">
                  {savingCategory ? (
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
          open={!!deleteCategoryTarget}
          onOpenChange={(open) => {
            if (!open && !deletingCategory) setDeleteCategoryTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الفئة؟</AlertDialogTitle>
              <AlertDialogDescription>
                هيتمسح{" "}
                <span className="font-medium text-foreground">
                  {deleteCategoryTarget?.name}
                </span>{" "}
                نهائياً. مش هينفع الرجوع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingCategory}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingCategory || !deleteCategoryTarget}
                onClick={(e) => {
                  e.preventDefault();
                  void onConfirmDeleteCategory();
                }}
              >
                {deletingCategory ? "جاري الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={addDepartmentOpen}
          onOpenChange={(open) => {
            if (!open && !creatingDepartment) {
              setAddDepartmentOpen(false);
              createDepartmentForm.reset({ name: "", slug: "" });
            } else {
              setAddDepartmentOpen(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إضافة قسم</DialogTitle>
              <DialogDescriptionBase>
                أنشئ قسم تذكرة جديداً. سيظهر في قوائم إنشاء التذاكر.
              </DialogDescriptionBase>
            </DialogHeader>

            <form
              onSubmit={createDepartmentForm.handleSubmit(onCreateDepartment)}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم</Label>
                  <Input
                    className="h-11"
                    {...createDepartmentForm.register("name")}
                    disabled={creatingDepartment}
                  />
                  {createDepartmentForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {createDepartmentForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المعرّف (اختياري)</Label>
                  <Input
                    className="h-11"
                    {...createDepartmentForm.register("slug")}
                    disabled={creatingDepartment}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDepartmentOpen(false)}
                  disabled={creatingDepartment}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={creatingDepartment} className="gap-2">
                  {creatingDepartment ? (
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
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>تعديل القسم</DialogTitle>
              <DialogDescriptionBase>تحديث اسم القسم والمعرّف والترتيب وحالة النشاط.</DialogDescriptionBase>
            </DialogHeader>
            <form onSubmit={editDepartmentForm.handleSubmit(onSaveDepartment)} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم</Label>
                  <Input {...editDepartmentForm.register("name")} className="h-11" />
                  {editDepartmentForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{editDepartmentForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المعرّف</Label>
                  <Input
                    {...editDepartmentForm.register("slug")}
                    className="h-11"
                    disabled={!!editingDepartment?.isSystem}
                  />
                  {editDepartmentForm.formState.errors.slug && (
                    <p className="text-sm text-destructive">{editDepartmentForm.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ترتيب العرض</Label>
                  <Input
                    type="number"
                    className="h-11"
                    {...editDepartmentForm.register("sortOrder", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نشط</Label>
                  <div className="h-11 flex items-center">
                    <Switch
                      checked={editDepartmentForm.watch("isActive")}
                      onCheckedChange={(checked) => editDepartmentForm.setValue("isActive", checked)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDepartment(null)}
                  disabled={savingDepartment}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={savingDepartment} className="gap-2">
                  {savingDepartment ? (
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
          open={!!deleteDepartmentTarget}
          onOpenChange={(open) => {
            if (!open && !deletingDepartment) setDeleteDepartmentTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف القسم؟</AlertDialogTitle>
              <AlertDialogDescription>
                هيتمسح{" "}
                <span className="font-medium text-foreground">
                  {deleteDepartmentTarget?.name}
                </span>{" "}
                نهائياً. مش هينفع الرجوع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingDepartment}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingDepartment || !deleteDepartmentTarget}
                onClick={(e) => {
                  e.preventDefault();
                  void onConfirmDeleteDepartment();
                }}
              >
                {deletingDepartment ? "جاري الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={addProductOpen}
          onOpenChange={(open) => {
            if (!open && !creatingProduct) {
              setAddProductOpen(false);
              createProductForm.reset({ name: "", slug: "" });
            } else {
              setAddProductOpen(open);
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إضافة منتج</DialogTitle>
              <DialogDescriptionBase>
                أنشئ منتج تذكرة جديداً. سيظهر في قوائم إنشاء التذاكر.
              </DialogDescriptionBase>
            </DialogHeader>

            <form
              onSubmit={createProductForm.handleSubmit(onCreateProduct)}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم</Label>
                  <Input
                    className="h-11"
                    {...createProductForm.register("name")}
                    disabled={creatingProduct}
                  />
                  {createProductForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {createProductForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المعرّف (اختياري)</Label>
                  <Input
                    className="h-11"
                    {...createProductForm.register("slug")}
                    disabled={creatingProduct}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddProductOpen(false)}
                  disabled={creatingProduct}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={creatingProduct} className="gap-2">
                  {creatingProduct ? (
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
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>تعديل المنتج</DialogTitle>
              <DialogDescriptionBase>تحديث اسم المنتج والمعرّف والترتيب وحالة النشاط.</DialogDescriptionBase>
            </DialogHeader>
            <form onSubmit={editProductForm.handleSubmit(onSaveProduct)} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الاسم</Label>
                  <Input {...editProductForm.register("name")} className="h-11" />
                  {editProductForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{editProductForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المعرّف</Label>
                  <Input
                    {...editProductForm.register("slug")}
                    className="h-11"
                    disabled={!!editingProduct?.isSystem}
                  />
                  {editProductForm.formState.errors.slug && (
                    <p className="text-sm text-destructive">{editProductForm.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ترتيب العرض</Label>
                  <Input
                    type="number"
                    className="h-11"
                    {...editProductForm.register("sortOrder", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نشط</Label>
                  <div className="h-11 flex items-center">
                    <Switch
                      checked={editProductForm.watch("isActive")}
                      onCheckedChange={(checked) => editProductForm.setValue("isActive", checked)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  disabled={savingProduct}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={savingProduct} className="gap-2">
                  {savingProduct ? (
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
          open={!!deleteProductTarget}
          onOpenChange={(open) => {
            if (!open && !deletingProduct) setDeleteProductTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المنتج؟</AlertDialogTitle>
              <AlertDialogDescription>
                هيتمسح{" "}
                <span className="font-medium text-foreground">
                  {deleteProductTarget?.name}
                </span>{" "}
                نهائياً. مش هينفع الرجوع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingProduct}>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingProduct || !deleteProductTarget}
                onClick={(e) => {
                  e.preventDefault();
                  void onConfirmDeleteProduct();
                }}
              >
                {deletingProduct ? "جاري الحذف..." : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </SettingsFormCard>
  );
}
