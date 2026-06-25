import Link from "next/link";
import { getAllTickets } from "@/actions/admin";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import {
  Ticket as TicketIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { STATUS_LABELS, UI } from "@/lib/strings";

// Disable static generation for this page since it has dynamic data
export const dynamic = "force-dynamic";

interface TicketsPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    view?: string;
  }>;
}

export default async function AdminTicketsPage({
  searchParams,
}: TicketsPageProps) {
  const params = await searchParams;
  const filters = {
    status: params.status,
    priority: params.priority,
    search: params.search,
  };

  // Get tickets with filters
  const ticketsResult = await getAllTickets(filters);
  const tickets = ticketsResult.success ? ticketsResult.data || [] : [];

  const viewMode = params.view === "card" ? "card" : "table";

  // Status buckets
  const openTickets = tickets.filter((t) => t.status === "open");
  const scheduledMeetingTickets = tickets.filter(
    (t) => t.status === "scheduled_meeting"
  );
  const waitingTickets = tickets.filter(
    (t) => t.status === "waiting_on_customer"
  );
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  // Stats configuration for admin-wide overview
  const ticketStats = [
    {
      title: "إجمالي التذاكر",
      value: tickets.length,
      icon: TicketIcon,
      description: "كل التذاكر في النظام",
    },
    {
      title: STATUS_LABELS.open,
      value: openTickets.length,
      icon: AlertCircle,
      description: STATUS_LABELS.waiting_on_customer,
    },
    {
      title: STATUS_LABELS.in_progress,
      value: inProgressTickets.length,
      icon: Clock,
      description: STATUS_LABELS.in_progress,
    },
    {
      title: `${STATUS_LABELS.resolved} / ${STATUS_LABELS.closed}`,
      value: resolvedTickets.length + closedTickets.length,
      icon: CheckCircle2,
      description: "مكتملة",
    },
  ];

  const tabItems = [
    { value: "all", label: UI.all, count: tickets.length },
    { value: "open", label: STATUS_LABELS.open, count: openTickets.length },
    {
      value: "scheduled_meeting",
      label: STATUS_LABELS.scheduled_meeting,
      count: scheduledMeetingTickets.length,
    },
    {
      value: "waiting_on_customer",
      label: STATUS_LABELS.waiting_on_customer,
      count: waitingTickets.length,
    },
    {
      value: "in_progress",
      label: STATUS_LABELS.in_progress,
      count: inProgressTickets.length,
    },
    { value: "resolved", label: STATUS_LABELS.resolved, count: resolvedTickets.length },
    { value: "closed", label: STATUS_LABELS.closed, count: closedTickets.length },
  ];

  return (
    <div className="space-y-6 text-start">
      <AdminPageHeader
        title={UI.tickets}
        description="إدارة تذاكر الدعم والرد على العملاء"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/tickets/new">
              <Plus className="h-4 w-4" />
              افتح تذكرة
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <StatsGrid stats={ticketStats} />

      {/* Tickets List */}
      <Card className="border-border rounded-lg p-3 shadow-none sm:p-4">
        <Tabs defaultValue="all">
          <PageTabsHeader
            tabs={tabItems}
            showSearch
            searchPlaceholder={`${UI.search} ${UI.tickets}...`}
            searchDefaultValue={filters.search}
            showPriorityFilter
            priorityDefaultValue={filters.priority}
            rightActions={<ViewToggle />}
          />

          <TabsContent
            value="all"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {tickets.length === 0 ? (
              <EmptySearchResults
                searchQuery={filters.search}
                entityName={UI.tickets}
              />
            ) : viewMode === "table" ? (
              <TicketsTable tickets={tickets} hrefBase="/admin/tickets" />
            ) : (
              tickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="open"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {openTickets.length === 0 ? (
              <Card className="rounded-lg">
                <CardContent className="py-8  text-center text-muted-foreground">
                  لا يوجد تذاكر {STATUS_LABELS.open}
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={openTickets} hrefBase="/admin/tickets" />
            ) : (
              openTickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="scheduled_meeting"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {scheduledMeetingTickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد تذاكر {STATUS_LABELS.scheduled_meeting}
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={scheduledMeetingTickets}
                hrefBase="/admin/tickets"
              />
            ) : (
              scheduledMeetingTickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="waiting_on_customer"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {waitingTickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد تذاكر {STATUS_LABELS.waiting_on_customer}
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={waitingTickets}
                hrefBase="/admin/tickets"
              />
            ) : (
              waitingTickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="in_progress"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {inProgressTickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد تذاكر {STATUS_LABELS.in_progress}
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={inProgressTickets}
                hrefBase="/admin/tickets"
              />
            ) : (
              inProgressTickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="resolved"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {resolvedTickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد تذاكر {STATUS_LABELS.resolved}
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={resolvedTickets}
                hrefBase="/admin/tickets"
              />
            ) : (
              resolvedTickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="closed"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {closedTickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد تذاكر {STATUS_LABELS.closed}
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={closedTickets} hrefBase="/admin/tickets" />
            ) : (
              closedTickets?.map((ticket) => (
                <div key={ticket._id.toString()}>
                  <TicketCard ticket={ticket} hrefBase="/admin/tickets" />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
