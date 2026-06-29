"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/types";
import { StatusBadge } from "./status-badge";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TicketBulkActions } from "./ticket-bulk-actions";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import { useTableSelection } from "@/hooks/use-table-selection";
import { useDataTablePagination } from "@/hooks/use-data-table-pagination";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableBulkActions } from "@/components/ui/data-table-bulk-actions";
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
} from "@/components/ui/dropdown-menu";
import { CATEGORY_LABELS, FORM_UI, TICKET_UI, UI } from "@/lib/strings";
import { adminTableHeadClass } from "@/components/ui/arabic-ux";
import {
  adminTableShellClass,
  adminTableShellDir,
} from "@/components/ui/admin-table-shell";

interface TicketsTableProps {
  tickets: Ticket[];
  hrefBase?: string;
  getHref?: (ticket: Ticket) => string;
}

export function TicketsTable({
  tickets,
  hrefBase = "/dashboard/tickets",
  getHref,
}: TicketsTableProps) {
  const {
    page,
    pageSize,
    pageSizeOptions,
    paginatedItems: paginatedTickets,
    startItem,
    endItem,
    totalItems,
    goToPage,
    updatePageSize,
  } = useDataTablePagination(tickets);
  const selection = useTableSelection(tickets, (ticket) =>
    ticket._id.toString(),
  );
  // Bulk actions are staff-only. Customer dashboard tables use a "/dashboard"
  // hrefBase and never get them.
  const enableBulkActions =
    hrefBase.startsWith("/admin") || hrefBase.startsWith("/support-agent");

  const ticketHref = (ticket: Ticket) =>
    getHref ? getHref(ticket) : `${hrefBase}/${ticket._id.toString()}`;

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        لا يوجد تذاكر
      </div>
    );
  }

  return (
    <>
      {enableBulkActions && (
        <DataTableBulkActions
          selectedCount={selection.selectedCount}
          itemLabel={FORM_UI.ticketsCount}
          onClear={selection.clear}
        >
          <TicketBulkActions
            selectedIds={selection.selectedIdList}
            onDone={selection.clear}
          />
        </DataTableBulkActions>
      )}
      <div className={adminTableShellClass()} style={adminTableShellDir}>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
              <TableHead
                className={cn(adminTableHeadClass, "w-[100px]")}
                dir="rtl"
              >
                {UI.actions}
              </TableHead>
              <TableHead
                className={cn("hidden md:table-cell", adminTableHeadClass)}
                dir="rtl"
              >
                {TICKET_UI.lastActivity}
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                {UI.status}
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                {UI.priority}
              </TableHead>
              <TableHead
                className={cn("hidden lg:table-cell", adminTableHeadClass)}
                dir="rtl"
              >
                {TICKET_UI.category}
              </TableHead>
              <TableHead
                className={cn("hidden xl:table-cell", adminTableHeadClass)}
                dir="rtl"
              >
                {TICKET_UI.product}
              </TableHead>
              <TableHead className={adminTableHeadClass} dir="rtl">
                {UI.tickets}
              </TableHead>
              {enableBulkActions && (
                <TableHead className="h-12 w-[50px] px-4" dir="rtl">
                  <Checkbox
                    aria-label={UI.selectAll}
                    checked={selection.headerCheckedState}
                    onCheckedChange={() => selection.toggleAll()}
                    className="border-border/60"
                  />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background/50">
            {paginatedTickets.map((ticket) => (
              <TableRow
                key={ticket._id.toString()}
                data-state={
                  enableBulkActions &&
                  selection.isSelected(ticket._id.toString())
                    ? "selected"
                    : undefined
                }
                className={cn(
                  "border-b border-border/30 hover:bg-muted/30 transition-all duration-200 group",
                  enableBulkActions &&
                    selection.isSelected(ticket._id.toString()) &&
                    "bg-primary/5",
                )}
              >
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <div className="flex items-center justify-start gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted/60 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link
                            href={ticketHref(ticket)}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="me-2 h-4 w-4" />
                            {UI.view} التفاصيل
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                <TableCell
                  className="hidden md:table-cell px-4 py-3.5"
                  dir="rtl"
                >
                  <span className="text-sm text-muted-foreground/70">
                    {formatDistanceToNow(new Date(ticket.lastActivityAt), {
                      addSuffix: true,
                      locale: arSA,
                    })}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <StatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell
                  className="hidden lg:table-cell px-4 py-3.5"
                  dir="rtl"
                >
                  <span className="text-sm text-foreground/90">
                    {CATEGORY_LABELS[ticket.category] || ticket.category}
                  </span>
                </TableCell>
                <TableCell
                  className="hidden xl:table-cell px-4 py-3.5"
                  dir="rtl"
                >
                  <span className="text-sm text-foreground/90 block truncate max-w-[120px]">
                    {ticket.productName || "—"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5" dir="rtl">
                  <Link href={ticketHref(ticket)} className="block">
                    <div className="min-w-0 max-w-[180px]">
                      <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                        {ticket.ticketNumber}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                {enableBulkActions && (
                  <TableCell className="px-4 py-3.5" dir="rtl">
                    <Checkbox
                      aria-label={`تحديد التذكرة ${ticket.ticketNumber}`}
                      checked={selection.isSelected(ticket._id.toString())}
                      onCheckedChange={() =>
                        selection.toggle(ticket._id.toString())
                      }
                      className="border-border/60"
                    />
                  </TableCell>
                )}
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
    </>
  );
}
