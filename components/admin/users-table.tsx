"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CountryDisplay } from "@/components/shared/country-display";
import type { User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  Mail,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { useTableSelection } from "@/hooks/use-table-selection";
import { AccountStatusBulkActions } from "./account-status-bulk-actions";
import { useFormatDate } from "@/components/providers/settings-provider";
import { useDataTablePagination } from "@/hooks/use-data-table-pagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions";
import {
  formatRoleLabel,
  roleBadgeAppearance,
} from "@/components/shared/name-with-role";
import { adminTableHeadClass, RtlIconText } from "@/components/ui/arabic-ux";
import {
  adminTableShellClass,
  adminTableShellDir,
} from "@/components/ui/admin-table-shell";

interface UsersTableProps {
  users: (User & { rbacRoleName?: string; departmentNames?: string[] })[];
}

export function UsersTable({ users }: UsersTableProps) {
  const formatDate = useFormatDate({ includeTime: false });
  const { data: session } = useSession();
  const canManage =
    (session?.user as { role?: string } | undefined)?.role === "admin";
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const {
    page,
    pageSize,
    pageSizeOptions,
    paginatedItems: paginatedUsers,
    startItem,
    endItem,
    totalItems,
    goToPage,
    updatePageSize,
  } = useDataTablePagination(users);
  const selection = useTableSelection(users, (user) => user.id);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        ملقيناش مستخدمين
      </div>
    );
  }

  return (
    <>
      {canManage && (
        <DataTableBulkActions
          selectedCount={selection.selectedCount}
          itemLabel="عضو"
          onClear={selection.clear}
        >
          <AccountStatusBulkActions
            selectedIds={selection.selectedIdList}
            scope="team"
            onDone={selection.clear}
          />
        </DataTableBulkActions>
      )}

      <div className={adminTableShellClass()} style={adminTableShellDir}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
              <TableHead className={cn(adminTableHeadClass, "w-[100px]")} dir="rtl">
                إجراءات
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                تاريخ الانضمام
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                الدولة
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                القسم
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                الحالة
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                الدور
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                المستخدم
              </TableHead>
              <TableHead className="h-12 w-[50px] px-4" dir="rtl">
                {canManage && (
                  <Checkbox
                    aria-label="تحديد الكل"
                    checked={selection.headerCheckedState}
                    onCheckedChange={() => selection.toggleAll()}
                    className="border-border/60"
                  />
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background/50">
            {paginatedUsers.map((user) => (
              <TableRow
                key={user.id}
                data-state={
                  selection.isSelected(user.id) ? "selected" : undefined
                }
                className={cn(
                  "group border-b border-border/30 transition-all duration-200 hover:bg-muted/30",
                  selection.isSelected(user.id) && "bg-primary/5",
                )}
              >
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <div className="flex items-center justify-start gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 transition-colors hover:bg-muted/60"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="me-2 h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(user)}
                          className="cursor-pointer"
                        >
                          <Edit className="me-2 h-4 w-4" />
                          تعديل المستخدم
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          حذف المستخدم
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <RtlIconText icon={<Calendar className="h-4 w-4" />}>
                    <span className="text-sm text-muted-foreground/80">
                      {formatDate(user.createdAt)}
                    </span>
                  </RtlIconText>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <span className="text-sm text-foreground/80">
                    <CountryDisplay name={user.country} />
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  {user.departmentNames && user.departmentNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.departmentNames.map((dept) => (
                        <Badge
                          key={dept}
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                        >
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <AccountStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  {user.rbacRoleName ? (
                    <Badge
                      variant="outline"
                      className="border-violet-200 bg-transparent font-medium text-violet-600 dark:border-violet-500/30 dark:text-violet-400"
                    >
                      {user.rbacRoleName}
                    </Badge>
                  ) : (
                    (() => {
                      const appearance = roleBadgeAppearance(user.role);
                      return (
                        <Badge
                          variant={appearance.variant}
                          className={cn(
                            "font-medium capitalize",
                            appearance.className,
                          )}
                        >
                          {formatRoleLabel(user.role)}
                        </Badge>
                      );
                    })()
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <div
                    className="flex items-center justify-end gap-3"
                    dir="ltr"
                  >
                    <div className="min-w-0 text-right">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.name}
                      </p>
                      <RtlIconText
                        icon={<Mail className="h-3 w-3" />}
                        className="mt-0.5 text-xs text-muted-foreground/70"
                      >
                        <span className="truncate" dir="ltr">
                          {user.email}
                        </span>
                      </RtlIconText>
                    </div>
                    <Avatar className="h-9 w-9 shrink-0">
                      {user.image && (
                        <AvatarImage
                          src={user.image}
                          alt={user.name || "مستخدم"}
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  {canManage && (
                    <Checkbox
                      aria-label={`تحديد المستخدم ${user.name}`}
                      checked={selection.isSelected(user.id)}
                      onCheckedChange={() => selection.toggle(user.id)}
                      className="border-border/60"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          onPageChange={goToPage}
          onPageSizeChange={updatePageSize}
        />
      </div>

      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={selectedUser}
        mode="edit"
        entityLabel="عضو الفريق"
        audience="team"
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
        entityLabel="عضو الفريق"
      />
    </>
  );
}
