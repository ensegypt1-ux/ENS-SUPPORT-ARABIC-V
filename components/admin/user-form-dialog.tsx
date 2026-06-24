"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, updateUserSchema } from "@/lib/validations";
import { createUser, updateUser } from "@/actions/admin";
import type { CreateUserFormData, UpdateUserFormData, User } from "@/types";
import { getAssignableRbacRoles } from "@/actions/rbac-roles";
import { getActiveTicketDepartments } from "@/actions/ticket-departments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, UserPlus, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";

type UserRole = "customer" | "support" | "admin";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  mode: "create" | "edit";
  entityLabel?: string;
  /**
   * Audience for the form. "team" hides the Customer role, defaults to a staff
   * role, and exposes the permission-role selector for admins/support so they
   * can be assigned custom roles. Defaults to the original (all-roles) behavior.
   */
  audience?: "team" | "customer";
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  mode,
  entityLabel = "مستخدم",
  audience,
}: UserFormDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rbacRolesLoading, setRbacRolesLoading] = useState(false);
  const [rbacRoles, setRbacRoles] = useState<
    Array<{
      id: string;
      name: string;
      key: string;
      isSystem: boolean;
      scopeBaseRole: UserRole;
    }>
  >([]);
  const defaultRbacRoleValue = "__default__";
  const [departments, setDepartments] = useState<
    Array<{ slug: string; name: string }>
  >([]);

  const isEditMode = mode === "edit" && user;
  const isTeamAudience = audience === "team";
  // Customer audience hides the role/permission selectors entirely and locks
  // the role to "customer" — mirrors the public signup fields.
  const isCustomerAudience = audience === "customer";

  // Role dropdown options for the standard (non-team) flow.
  const roleOptions: { value: UserRole; label: string }[] = [
    { value: "customer", label: "عميل" },
    { value: "support", label: "دعم فني" },
    { value: "admin", label: "مدير" },
  ];
  const defaultRole: UserRole = isTeamAudience ? "support" : "customer";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: isEditMode
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          rbacRoleId: user.rbacRoleId || "",
          country: user.country || "",
          departmentSlugs: user.departmentSlugs || [],
          password: "",
          confirmPassword: "",
        }
      : {
          name: "",
          email: "",
          role: defaultRole,
          rbacRoleId: "",
          country: "",
          departmentSlugs: [],
          password: "",
          confirmPassword: "",
        },
  });

  const role = watch("role");
  const rbacRoleId = watch("rbacRoleId");
  const country = watch("country");
  const departmentSlugs = (watch("departmentSlugs") as string[]) || [];

  // Team flow uses a single Role dropdown sourced from the RBAC roles defined
  // in Settings → Access. The selected value is the RBAC role id; selecting one
  // derives the base role (scope) and, for custom roles, the rbacRoleId.
  const selectedRoleValue = isTeamAudience
    ? rbacRoleId && rbacRoleId.length > 0
      ? rbacRoleId
      : rbacRoles.find((r) => r.isSystem && r.scopeBaseRole === role)?.id ?? ""
    : "";

  const handleTeamRoleChange = (id: string) => {
    const selected = rbacRoles.find((r) => r.id === id);
    if (!selected) return;
    setValue("role", selected.scopeBaseRole, { shouldDirty: true });
    // System (default) roles store no rbacRoleId; custom roles store their id.
    setValue("rbacRoleId", selected.isSystem ? "" : selected.id, {
      shouldDirty: true,
    });
  };

  // Permission (custom) role applies to customers in the standard flow only.
  const showPermissionRole = !isTeamAudience && role === "customer";

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setShowConfirmPassword(false);
      if (isEditMode) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role,
          rbacRoleId: user.rbacRoleId || "",
          country: user.country || "",
          departmentSlugs: user.departmentSlugs || [],
          password: "",
          confirmPassword: "",
        });
      } else {
        reset({
          name: "",
          email: "",
          role: defaultRole,
          rbacRoleId: "",
          country: "",
          departmentSlugs: [],
          password: "",
          confirmPassword: "",
        });
      }
    }
  }, [open, isEditMode, user, reset, defaultRole]);

  // Team flow: load all staff-assignable roles (admin + support scopes) once.
  useEffect(() => {
    if (!open || !isTeamAudience) return;
    let cancelled = false;
    (async () => {
      setRbacRolesLoading(true);
      const [adminRes, supportRes] = await Promise.all([
        getAssignableRbacRoles("admin"),
        getAssignableRbacRoles("support"),
      ]);
      if (!cancelled) {
        setRbacRoles([
          ...(adminRes.success && adminRes.data ? adminRes.data : []),
          ...(supportRes.success && supportRes.data ? supportRes.data : []),
        ]);
        setRbacRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isTeamAudience]);

  // Standard flow: load roles scoped to the currently selected base role.
  useEffect(() => {
    if (!open || isTeamAudience || isCustomerAudience) return;
    let cancelled = false;
    (async () => {
      setRbacRolesLoading(true);
      const result = await getAssignableRbacRoles(role);
      if (!cancelled) {
        setRbacRoles(result.success && result.data ? result.data : []);
        setRbacRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, role, isTeamAudience, isCustomerAudience]);

  useEffect(() => {
    if (!open || role !== "support") return;
    let cancelled = false;
    getActiveTicketDepartments().then((res) => {
      if (!cancelled && res.success && res.data) setDepartments(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, role]);

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    setIsLoading(true);

    try {
      let result;

      if (isEditMode) {
        result = await updateUser(user.id, data as UpdateUserFormData);
      } else {
        result = await createUser(data as CreateUserFormData);
      }

      if (result.success) {
        toast.success(
          result.message ||
            `${isEditMode ? "اتحدّث" : "اتعمل"} ${entityLabel}`
        );
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "حصل خطأ");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حصل خطأ مش متوقع"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const HeaderIcon = isEditMode ? UserCog : UserPlus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-135 gap-0 p-0 overflow-hidden">
        <DialogHeader className="space-y-0 border-b border-border bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <HeaderIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold leading-none">
                {isEditMode ? `تعديل ${entityLabel}` : `إنشاء ${entityLabel} جديد`}
              </DialogTitle>
              <DialogDescription className="text-sm leading-snug">
                {isEditMode
                  ? `تحديث بيانات ${entityLabel} والصلاحيات.`
                  : `إضافة ${entityLabel} جديد بصلاحية تسجيل الدخول.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
            {/* Identity */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  الاسم <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="محمد أحمد"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  الإيميل <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Access & role */}
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              {isCustomerAudience ? null : isTeamAudience ? (
                /* Single Role dropdown sourced from Settings → Access (RBAC). */
                <div className="space-y-2">
                  <Label htmlFor="role">
                    الدور <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedRoleValue}
                    onValueChange={handleTeamRoleChange}
                    disabled={isLoading || rbacRolesLoading}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue
                        placeholder={
                          rbacRolesLoading ? "جاري التحميل..." : "اختر دورًا"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rbacRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    تُدار الأدوار والصلاحيات من الإعدادات ← الوصول.
                  </p>
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {errors.role.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      الدور <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={role}
                      onValueChange={(value) =>
                        setValue("role", value as UserRole)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue placeholder="اختر دورًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-destructive">
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Permission role */}
                  {showPermissionRole && (
                    <div className="space-y-2">
                      <Label htmlFor="rbacRoleId">دور الصلاحيات</Label>
                      <Select
                        value={
                          rbacRoleId && rbacRoleId.length > 0
                            ? rbacRoleId
                            : defaultRbacRoleValue
                        }
                        onValueChange={(value) =>
                          setValue(
                            "rbacRoleId",
                            value === defaultRbacRoleValue ? "" : value
                          )
                        }
                        disabled={isLoading || rbacRolesLoading}
                      >
                        <SelectTrigger id="rbacRoleId" className="w-full">
                          <SelectValue
                            placeholder={
                              rbacRolesLoading ? "جاري التحميل..." : "افتراضي"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={defaultRbacRoleValue}>
                            افتراضي
                          </SelectItem>
                          {rbacRoles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {role === "support" && (
                <div className="space-y-2">
                  <Label>
                    أقسام التذاكر{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    يصنّف وكيل الذكاء الاصطناعي كل استفسار عميل ويُعيّن تذكرة
                    التصعيد تلقائيًا لوكيل دعم يغطي القسم المطابق.
                  </p>
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3">
                    {departments.length === 0 && (
                      <p className="col-span-2 text-xs text-muted-foreground">
                        مفيش أقسام نشطة. أنشئ قسمًا أولًا من إعدادات
                        التذاكر.
                      </p>
                    )}
                    {departments.map((d) => {
                      const checked = departmentSlugs.includes(d.slug);
                      return (
                        <label
                          key={d.slug}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...departmentSlugs, d.slug]
                                : departmentSlugs.filter((s) => s !== d.slug);
                              setValue("departmentSlugs", next, {
                                shouldDirty: true,
                              });
                            }}
                          />
                          {d.name}
                        </label>
                      );
                    })}
                  </div>
                  {errors.departmentSlugs && (
                    <p className="text-sm text-destructive">
                      {errors.departmentSlugs.message as string}
                    </p>
                  )}
                </div>
              )}

              {/* Country — not collected for support agents */}
              {role !== "support" && (
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة (اختياري)</Label>
                  <CountryCombobox
                    id="country"
                    value={country}
                    onValueChange={(value) =>
                      setValue("country", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={isLoading}
                    className="w-full"
                    modal
                    aria-invalid={!!errors.country}
                  />
                  {errors.country && (
                    <p className="text-sm text-destructive">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Credentials */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  كلمة المرور{" "}
                  {!isEditMode && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pe-10"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isEditMode && (
                  <p className="text-xs text-muted-foreground">
                    اتركه فارغًا للإبقاء على كلمة المرور الحالية.
                  </p>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  تأكيد كلمة المرور{" "}
                  {!isEditMode && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pe-10"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "جاري التحديث..." : "جاري الإنشاء..."}
                </>
              ) : (
                <>{isEditMode ? `تحديث ${entityLabel}` : `إنشاء ${entityLabel}`}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
