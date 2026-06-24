"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormatDate } from "@/components/providers/settings-provider";
import type { User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";
import { adminTableHeadClass, RtlIconText } from "@/components/ui/arabic-ux";
import {
  adminTableShellClass,
  adminTableShellDir,
} from "@/components/ui/admin-table-shell";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Ticket,
  CheckCircle2,
  Clock,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useDataTablePagination } from "@/hooks/use-data-table-pagination";
import { useTableSelection } from "@/hooks/use-table-selection";
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions";
import { AccountStatusBulkActions } from "./account-status-bulk-actions";
import { AccountStatusBadge } from "@/components/shared/account-status-badge";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

interface ClientUser extends User {
  ticketCount: number;
  openTickets: number;
  resolvedTickets: number;
  lastTicketDate?: Date;
}

interface ClientsTableProps {
  clients: ClientUser[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const formatDate = useFormatDate({ includeTime: false });
  const { data: session } = useSession();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ClientUser | null>(
    null,
  );
  const {
    page,
    pageSize,
    pageSizeOptions,
    paginatedItems: paginatedClients,
    startItem,
    endItem,
    totalItems,
    goToPage,
    updatePageSize,
  } = useDataTablePagination(clients);
  const selection = useTableSelection(clients, (client) => client.id);
  const canManageCustomer =
    (session?.user as { role?: string } | undefined)?.role === "admin";
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = (customer: ClientUser) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleDelete = (customer: ClientUser) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  if (clients.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        ملقيناش عملاء
      </div>
    );
  }

  return (
    <>
      {canManageCustomer && (
        <DataTableBulkActions
          selectedCount={selection.selectedCount}
          itemLabel="عميل"
          onClear={selection.clear}
        >
          <AccountStatusBulkActions
            selectedIds={selection.selectedIdList}
            scope="customer"
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
                التذاكر
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                الحالة
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                اسم مستخدم Envato
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                العميل
              </TableHead>
              <TableHead className="h-12 w-[50px] px-4" dir="rtl">
                {canManageCustomer && (
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
            {paginatedClients.map((client) => (
              <TableRow
                key={client.id}
                data-state={
                  selection.isSelected(client.id) ? "selected" : undefined
                }
                className={cn(
                  "group border-b border-border/30 transition-all duration-200 hover:bg-muted/30",
                  selection.isSelected(client.id) && "bg-primary/5",
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
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/customers/${client.id}`}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="me-2 h-4 w-4" />
                            عرض التفاصيل
                          </Link>
                        </DropdownMenuItem>
                        {canManageCustomer && (
                          <DropdownMenuItem
                            onClick={() => handleEdit(client)}
                            className="cursor-pointer"
                          >
                            <Edit className="me-2 h-4 w-4" />
                            تعديل العميل
                          </DropdownMenuItem>
                        )}
                        {canManageCustomer && <DropdownMenuSeparator />}
                        {canManageCustomer && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(client)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            حذف العميل
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <RtlIconText icon={<Calendar className="h-4 w-4" />}>
                    <span className="text-sm text-muted-foreground/80">
                      {formatDate(client.createdAt)}
                    </span>
                  </RtlIconText>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5" title="إجمالي التذاكر">
                      <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{client.ticketCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="التذاكر المفتوحة">
                      <Clock className="h-3.5 w-3.5 text-warning" />
                      <span className="font-medium text-warning">
                        {client.openTickets}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5" title="التذاكر المحلولة">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span className="font-medium text-success">
                        {client.resolvedTickets}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <AccountStatusBadge status={client.status} />
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  {client.envatoUsername ? (
                    <Badge variant="outline" className="font-normal" dir="ltr">
                      @{client.envatoUsername}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <div
                    className="flex items-center justify-end gap-3"
                    dir="ltr"
                  >
                    <div className="min-w-0 text-right">
                      <p className="truncate text-sm font-medium text-foreground">
                        {client.name}
                      </p>
                      <RtlIconText
                        icon={<Mail className="h-3 w-3" />}
                        className="mt-0.5 text-xs text-muted-foreground/70"
                      >
                        <span className="truncate" dir="ltr">
                          {client.email}
                        </span>
                      </RtlIconText>
                    </div>
                    <Avatar className="h-9 w-9 shrink-0">
                      {client.image && (
                        <AvatarImage
                          src={client.image}
                          alt={client.name || "مستخدم"}
                        />
                      )}
                      <AvatarFallback className="bg-info/10 text-xs font-medium text-info">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  {canManageCustomer && (
                    <Checkbox
                      aria-label={`تحديد العميل ${client.name}`}
                      checked={selection.isSelected(client.id)}
                      onCheckedChange={() => selection.toggle(client.id)}
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
        user={selectedCustomer}
        mode="edit"
        entityLabel="عميل"
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedCustomer}
        entityLabel="عميل"
      />
    </>
  );
}
