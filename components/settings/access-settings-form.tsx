"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Shield } from "lucide-react";

import { PERMISSIONS, RBAC_ROLE_SCOPES, type Permission, type RbacRoleScope } from "@/types/rbac";
import {
  createRbacRoleAction,
  deleteRbacRoleAction,
  getRbacRoles,
  updateRbacRoleAction,
} from "@/actions/rbac-roles";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PanelSectionHeader } from "@/components/ui/panel-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminTableHeadClass } from "@/components/ui/arabic-ux";
import { adminTableShellClass } from "@/components/ui/admin-table-shell";

const roleSchema = z.object({
  name: z.string().min(2).max(60),
  key: z.string().min(2).max(64),
  description: z.string().max(200).optional(),
  scopeBaseRole: z.enum(RBAC_ROLE_SCOPES),
  permissions: z.array(z.enum(PERMISSIONS)),
});

type RoleFormData = z.infer<typeof roleSchema>;

const SCOPE_ROLE_LABELS: Record<RbacRoleScope, string> = {
  customer: "العميل",
  support: "الدعم",
  admin: "مسؤول",
};

const PERMISSION_GROUP_LABELS: Record<string, string> = {
  panel: "لوحة التحكم",
  settings: "الإعدادات",
  rbac: "الصلاحيات",
  users: "المستخدمون",
  tickets: "التذاكر",
  comments: "التعليقات",
  services: "الخدمات",
  analytics: "التحليلات",
  messages: "الرسائل",
  newsletter: "النشرة البريدية",
  landing: "صفحة الهبوط",
  notifications: "الإشعارات",
  meetings: "الاجتماعات",
  clients: "العملاء",
  other: "أخرى",
};

function groupPermissions(perms: readonly Permission[]) {
  const grouped: Record<string, Permission[]> = {};
  for (const p of perms) {
    const group = p.split(".")[0] || "other";
    grouped[group] ||= [];
    grouped[group].push(p);
  }
  return grouped;
}

function RoleActions({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleRow;
  onEdit: (role: RoleRow) => void;
  onDelete: (role: RoleRow) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onEdit(role)}
        aria-label={`تعديل ${role.name}`}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
        onClick={() => onDelete(role)}
        disabled={role.isSystem}
        title={role.isSystem ? "أدوار النظام لا يمكن حذفها" : `حذف ${role.name}`}
        aria-label={role.isSystem ? "لا يمكن حذف دور النظام" : `حذف ${role.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

type RoleRow = Omit<import("@/types/rbac").RbacRole, "_id"> & { _id: string };

export function AccessSettingsForm() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const groupedPermissions = useMemo(() => groupPermissions(PERMISSIONS), []);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      scopeBaseRole: "support",
      permissions: [],
    },
  });

  const watchedPerms = form.watch("permissions");

  const load = async () => {
    setLoading(true);
    const result = await getRbacRoles();
    if (!result.success || !result.data) {
      toast.error(result.error || "تعذّر تحميل الأدوار");
      setRoles([]);
      setLoading(false);
      return;
    }
    setRoles(result.data as unknown as RoleRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setMode("create");
    setSelectedRole(null);
    form.reset({
      name: "",
      key: "",
      description: "",
      scopeBaseRole: "support",
      permissions: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (role: RoleRow) => {
    setMode("edit");
    setSelectedRole(role);
    form.reset({
      name: role.name,
      key: role.key,
      description: role.description || "",
      scopeBaseRole: role.scopeBaseRole,
      permissions: (role.permissions || []) as Permission[],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: RoleFormData) => {
    setSaving(true);
    try {
      if (mode === "create") {
        const result = await createRbacRoleAction({
          name: data.name,
          key: data.key,
          description: data.description,
          scopeBaseRole: data.scopeBaseRole,
          permissions: data.permissions,
        });
        if (!result.success) {
          toast.error(result.error || "تعذّر إنشاء الدور");
          return;
        }
        toast.success("تم إنشاء الدور");
      } else if (selectedRole) {
        const result = await updateRbacRoleAction({
          roleId: selectedRole._id,
          name: data.name,
          description: data.description,
          permissions: data.permissions,
        });
        if (!result.success) {
          toast.error(result.error || "تعذّر تحديث الدور");
          return;
        }
        toast.success("تم تحديث الدور");
      }
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (perm: Permission) => {
    const current = new Set<Permission>(watchedPerms || []);
    if (current.has(perm)) current.delete(perm);
    else current.add(perm);
    form.setValue("permissions", Array.from(current), { shouldValidate: true });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteRbacRoleAction(deleteTarget._id);
      if (!result.success) {
        toast.error(result.error || "تعذّر حذف الدور");
        return;
      }
      toast.success("تم حذف الدور");
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const editingSystemRole = mode === "edit" && selectedRole?.isSystem;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card className="rounded-lg border-0">
        <CardHeader className="p-4 sm:p-6" dir="rtl">
          <PanelSectionHeader
            title="التحكم بالصلاحيات والأدوار"
            icon={<Shield className="h-5 w-5 text-muted-foreground" />}
            actions={
              <Button onClick={openCreate} disabled={loading} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span>دور جديد</span>
              </Button>
            }
          />
        </CardHeader>
        <CardContent dir="rtl" className="px-4 pb-4 sm:px-6 sm:pb-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تحميل الأدوار...
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {roles.map((role) => (
                  <div
                    key={String(role._id)}
                    className="rounded-lg border border-border/60 bg-background/80 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground">{role.name}</p>
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">
                          {role.key}
                        </p>
                      </div>
                      <RoleActions role={role} onEdit={openEdit} onDelete={setDeleteTarget} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {SCOPE_ROLE_LABELS[role.scopeBaseRole] ?? role.scopeBaseRole}
                      </Badge>
                      {role.isSystem ? (
                        <Badge variant="outline">نظام</Badge>
                      ) : (
                        <Badge variant="secondary">مخصص</Badge>
                      )}
                      <Badge variant="outline">
                        {(role.permissions || []).length} صلاحية
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className={cn(adminTableShellClass(), "hidden md:block overflow-x-auto")}>
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow className="border-b border-border/50 bg-muted/20 hover:bg-muted/20">
                      <TableHead className={adminTableHeadClass}>الدور</TableHead>
                      <TableHead className={adminTableHeadClass}>الأساس</TableHead>
                      <TableHead className={adminTableHeadClass}>الصلاحيات</TableHead>
                      <TableHead className={adminTableHeadClass}>النوع</TableHead>
                      <TableHead className={cn(adminTableHeadClass, "w-[100px] text-start")}>
                        الإجراءات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-background/50">
                    {roles.map((role) => (
                      <TableRow
                        key={String(role._id)}
                        className="border-b border-border/30 hover:bg-muted/30 transition-all duration-200"
                      >
                        <TableCell className="py-3 px-4">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground">{role.name}</p>
                            <p className="text-xs text-muted-foreground truncate" dir="ltr">
                              {role.key}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="secondary">
                            {SCOPE_ROLE_LABELS[role.scopeBaseRole] ?? role.scopeBaseRole}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-muted-foreground">
                          {(role.permissions || []).length}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {role.isSystem ? (
                            <Badge variant="outline">نظام</Badge>
                          ) : (
                            <Badge variant="secondary">مخصص</Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <RoleActions role={role} onEdit={openEdit} onDelete={setDeleteTarget} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          dir="rtl"
          className="flex max-h-[min(92dvh,960px)] w-[calc(100%-1rem)] max-w-[min(100vw-1rem,920px)] flex-col gap-0 overflow-hidden p-0 sm:w-full"
        >
          <DialogHeader className="shrink-0 border-b px-4 py-4 text-right sm:px-6">
            <DialogTitle>
              {mode === "create" ? "إنشاء دور" : "تعديل الدور"}
            </DialogTitle>
            {editingSystemRole ? (
              <p className="text-xs text-muted-foreground pt-1">
                دور نظام — يمكن تعديل الاسم والوصف والصلاحيات. لا يمكن تغيير المفتاح أو الحذف.
              </p>
            ) : null}
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input id="name" disabled={saving} {...form.register("name")} />
                  {form.formState.errors.name?.message && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">المفتاح</Label>
                  <Input
                    id="key"
                    dir="ltr"
                    className="text-start"
                    disabled={saving || mode === "edit"}
                    {...form.register("key")}
                  />
                  {form.formState.errors.key?.message && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.key.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>الدور الأساسي</Label>
                  <Select
                    value={form.watch("scopeBaseRole")}
                    onValueChange={(v) =>
                      form.setValue("scopeBaseRole", v as RoleFormData["scopeBaseRole"], {
                        shouldValidate: true,
                      })
                    }
                    disabled={saving || mode === "edit"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور الأساسي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">العميل</SelectItem>
                      <SelectItem value="support">الدعم</SelectItem>
                      <SelectItem value="admin">مسؤول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    className="min-h-[40px]"
                    disabled={saving}
                    {...form.register("description")}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>الصلاحيات</Label>
                  <span className="text-xs text-muted-foreground shrink-0">
                    المحددة: {watchedPerms?.length || 0}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <div key={group} className="rounded-lg border p-3 min-w-0">
                      <p className="text-sm font-medium mb-2">
                        {PERMISSION_GROUP_LABELS[group] ?? group}
                      </p>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const checked = (watchedPerms || []).includes(perm);
                          return (
                            <label
                              key={perm}
                              className={cn(
                                "flex items-start gap-2 text-sm cursor-pointer",
                                saving && "opacity-60 cursor-not-allowed",
                              )}
                            >
                              <Checkbox
                                className="mt-0.5 shrink-0"
                                checked={checked}
                                onCheckedChange={() => togglePermission(perm)}
                                disabled={saving}
                              />
                              <span className="leading-5 break-all" dir="ltr">
                                {perm}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t px-4 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الدور</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `حذف «${deleteTarget.name}»؟ لا يمكن التراجع عن هذا الإجراء.`
                : "حذف هذا الدور؟"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
