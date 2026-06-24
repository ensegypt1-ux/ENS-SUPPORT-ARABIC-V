import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StatsGrid } from "@/components/shared/stats-grid";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { getMyInstallationRequests } from "@/actions/support-agent";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import { Download, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface InstallationPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    view?: string;
  }>;
}

export default async function SupportAgentInstallationPage({
  searchParams,
}: InstallationPageProps) {
  const params = await searchParams;
  const filters = {
    status: params.status,
    priority: params.priority,
    search: params.search,
  };

  // Get assigned installation requests with filters
  const requestsResult = await getMyInstallationRequests(filters);
  const requests = requestsResult.success ? requestsResult.data || [] : [];

  const viewMode = params.view === "card" ? "card" : "table";

  // Status buckets
  const openRequests = requests.filter((r) => r.status === "open");
  const scheduledMeetingRequests = requests.filter(
    (r) => r.status === "scheduled_meeting"
  );
  const waitingRequests = requests.filter(
    (r) => r.status === "waiting_on_customer"
  );
  const inProgressRequests = requests.filter((r) => r.status === "in_progress");
  const resolvedRequests = requests.filter((r) => r.status === "resolved");
  const closedRequests = requests.filter((r) => r.status === "closed");

  const installationStats = [
    {
      title: "إجمالي المعيّن",
      value: requests.length,
      icon: Download,
      iconColor: "text-sky-600",
      iconBgColor: "bg-sky-50 dark:bg-sky-950",
      description: "طلبات التثبيت المعيّنة لك",
    },
    {
      title: "مفتوحة",
      value: openRequests.length,
      icon: AlertCircle,
      iconColor: "text-amber-600",
      iconBgColor: "bg-amber-50 dark:bg-amber-950",
      description: "في انتظار ردك",
    },
    {
      title: "قيد المعالجة",
      value: inProgressRequests.length,
      icon: Clock,
      iconColor: "text-indigo-600",
      iconBgColor: "bg-indigo-50 dark:bg-indigo-950",
      description: "تعمل عليها حاليًا",
    },
    {
      title: "محلولة / مغلقة",
      value: resolvedRequests.length + closedRequests.length,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBgColor: "bg-emerald-50 dark:bg-emerald-950",
      description: "تثبيتات مكتملة",
    },
  ];

  const tabItems = [
    { value: "all", label: "الكل", count: requests.length },
    { value: "open", label: "مفتوحة", count: openRequests.length },
    {
      value: "scheduled_meeting",
      label: "اجتماع مجدول",
      count: scheduledMeetingRequests.length,
    },
    {
      value: "waiting_on_customer",
      label: "في الانتظار",
      count: waitingRequests.length,
    },
    {
      value: "in_progress",
      label: "قيد المعالجة",
      count: inProgressRequests.length,
    },
    { value: "resolved", label: "محلولة", count: resolvedRequests.length },
    { value: "closed", label: "مغلقة", count: closedRequests.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">طلبات التثبيت الخاصة بي</h1>
        <p className="text-muted-foreground mt-1">
          إدارة طلبات خدمة التثبيت المعيّنة لك
        </p>
      </div>

      {/* Stats Cards */}
      <StatsGrid stats={installationStats} />

      {/* Requests List */}
      <Card className="p-4">
        <Tabs defaultValue="all">
          <PageTabsHeader
            tabs={tabItems}
            showSearch
            searchPlaceholder="بحث في الطلبات..."
            searchDefaultValue={filters.search}
            showPriorityFilter
            priorityDefaultValue={filters.priority}
            rightActions={<ViewToggle />}
          />

          <TabsContent
            value="all"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {requests.length === 0 ? (
              <EmptySearchResults
                searchQuery={filters.search}
                entityName="طلبات"
              />
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={requests}
                hrefBase="/support-agent/installation"
              />
            ) : (
              requests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard
                    ticket={request}
                    hrefBase="/support-agent/installation"
                  />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="open"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {openRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  مفيش طلبات تثبيت مفتوحة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={openRequests} hrefBase="/support-agent/installation" />
            ) : (
              openRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase="/support-agent/installation" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="scheduled_meeting"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {scheduledMeetingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  مفيش طلبات تثبيت باجتماع مجدول
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={scheduledMeetingRequests}
                hrefBase="/support-agent/installation"
              />
            ) : (
              scheduledMeetingRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase="/support-agent/installation" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="waiting_on_customer"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {waitingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  مفيش طلبات تثبيت في الانتظار
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={waitingRequests} hrefBase="/support-agent/installation" />
            ) : (
              waitingRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase="/support-agent/installation" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="in_progress"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {inProgressRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  مفيش طلبات تثبيت قيد المعالجة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={inProgressRequests}
                hrefBase="/support-agent/installation"
              />
            ) : (
              inProgressRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase="/support-agent/installation" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="resolved"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {resolvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  مفيش طلبات تثبيت محلولة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={resolvedRequests} hrefBase="/support-agent/installation" />
            ) : (
              resolvedRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase="/support-agent/installation" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent
            value="closed"
            className={viewMode === "card" ? "space-y-3" : ""}
          >
            {closedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  مفيش طلبات تثبيت مغلقة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={closedRequests} hrefBase="/support-agent/installation" />
            ) : (
              closedRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase="/support-agent/installation" />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
