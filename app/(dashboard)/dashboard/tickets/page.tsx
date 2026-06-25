import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { getMyTickets } from "@/actions/tickets";
import { Card, CardContent } from "@/components/ui/card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { TicketCard } from "@/components/tickets/ticket-card";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import {
  Plus,
  Ticket as TicketIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { STATUS_LABELS, UI } from "@/lib/strings";
import { Tabs, TabsContent } from "@/components/ui/tabs";
interface TicketsPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    view?: string;
  }>;
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  await requireAuth();
  const params = await searchParams;
  const filters = {
    status: params.status,
    priority: params.priority,
    search: params.search,
  };
  const viewMode = params.view || "table";

  const ticketsResult = await getMyTickets(filters);
  const tickets = ticketsResult.success ? ticketsResult.data || [] : [];

  // Filter tickets by status
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

  const ticketStats = [
    {
      title: STATUS_LABELS.open,
      value: openTickets.length,
      icon: AlertCircle,
      description: "تذاكر نشطة",
    },
    {
      title: STATUS_LABELS.in_progress,
      value: inProgressTickets.length,
      icon: Clock,
      description: STATUS_LABELS.in_progress,
    },
    {
      title: STATUS_LABELS.resolved,
      value: resolvedTickets.length,
      icon: CheckCircle2,
      description: "اتحلّت",
    },
    {
      title: STATUS_LABELS.closed,
      value: closedTickets.length,
      icon: XCircle,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">طلباتي</h1>
          <p className="text-muted-foreground">
            شوف وتابع كل تذاكر الدعم بتاعتك
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/tickets/new">
              <Plus className="h-4 w-4" />
              افتح تذكرة
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsGrid stats={ticketStats} />

      {/* Tickets List */}
      {tickets.length === 0 && !filters.search && !filters.priority ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">لا يوجد تذاكر لا تزال</h3>
            <p className="text-muted-foreground mt-2">
              افتح أول تذكرة دعم
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/tickets/new">
                <Plus className="me-2 h-4 w-4" />
                افتح تذكرة
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border p-4 shadow-none">
          <Tabs defaultValue="all">
            {/* Header with Tabs and Actions */}
            <PageTabsHeader
              tabs={tabItems}
              showSearch
              searchPlaceholder={`${UI.search}...`}
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
                <TicketsTable tickets={tickets} />
              ) : (
                tickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent
              value="open"
              className={viewMode === "card" ? "space-y-3" : ""}
            >
              {openTickets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    لا يوجد تذاكر مفتوحة
                  </CardContent>
                </Card>
              ) : viewMode === "table" ? (
                <TicketsTable tickets={openTickets} />
              ) : (
                openTickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
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
                <TicketsTable tickets={scheduledMeetingTickets} />
              ) : (
                scheduledMeetingTickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
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
                <TicketsTable tickets={waitingTickets} />
              ) : (
                waitingTickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
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
                <TicketsTable tickets={inProgressTickets} />
              ) : (
                inProgressTickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
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
                <TicketsTable tickets={resolvedTickets} />
              ) : (
                resolvedTickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
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
                <TicketsTable tickets={closedTickets} />
              ) : (
                closedTickets?.map((ticket) => (
                  <div key={ticket._id.toString()}>
                    <TicketCard ticket={ticket} />
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
