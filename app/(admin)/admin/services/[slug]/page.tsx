import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/actions/services";
import { getServiceRequestsForAdmin } from "@/actions/service-requests";
import { Card, CardContent } from "@/components/ui/card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Wrench,
} from "lucide-react";

export const dynamic = "force-dynamic";

function iconForKey(iconKey: string) {
  switch (iconKey) {
    case "wrench":
      return Wrench;
    case "download":
      return Download;
    default:
      return Briefcase;
  }
}

export default async function AdminServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    view?: string;
  }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const result = await getServiceBySlug(slug);
  if (!result.success || !result.data) notFound();

  const service = result.data;
  const Icon = iconForKey(service.iconKey);
  const viewMode = sp.view === "card" ? "card" : "table";

  const filters = { status: sp.status, priority: sp.priority, search: sp.search };
  const requestsResult = await getServiceRequestsForAdmin(slug, filters);
  const requests = requestsResult.success ? requestsResult.data || [] : [];

  const openRequests = requests.filter((r) => r.status === "open");
  const scheduledMeetingRequests = requests.filter(
    (r) => r.status === "scheduled_meeting"
  );
  const waitingRequests = requests.filter((r) => r.status === "waiting_on_customer");
  const inProgressRequests = requests.filter((r) => r.status === "in_progress");
  const resolvedRequests = requests.filter((r) => r.status === "resolved");
  const closedRequests = requests.filter((r) => r.status === "closed");

  const stats = [
    {
      title: "إجمالي الطلبات",
      value: requests.length,
      icon: Icon,      description: `جميع تذاكر ${service.name}`,
    },
    {
      title: "مفتوحة",
      value: openRequests.length,
      icon: AlertCircle,      description: "في انتظار الإجراء",
    },
    {
      title: "قيد المعالجة",
      value: inProgressRequests.length,
      icon: Clock,      description: "قيد العمل",
    },
    {
      title: "مكتملة",
      value: resolvedRequests.length + closedRequests.length,
      icon: CheckCircle2,      description: "محلولة أو مغلقة",
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
    { value: "waiting_on_customer", label: "في الانتظار", count: waitingRequests.length },
    { value: "in_progress", label: "قيد المعالجة", count: inProgressRequests.length },
    { value: "resolved", label: "محلولة", count: resolvedRequests.length },
    { value: "closed", label: "مغلقة", count: closedRequests.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {service.name} Requests
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            إدارة جميع طلبات {service.name.toLowerCase()} للعملاء
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/admin/services/${slug}/new`}>
            <Plus className="h-4 w-4 me-2" />
            طلب جديد
          </Link>
        </Button>
      </div>

      <StatsGrid stats={stats} />

      <Card className="p-3 sm:p-4">
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

          <TabsContent value="all" className={viewMode === "card" ? "space-y-3" : ""}>
            {requests.length === 0 ? (
              <EmptySearchResults searchQuery={filters.search} entityName="طلبات" />
            ) : viewMode === "table" ? (
              <TicketsTable tickets={requests} hrefBase={`/admin/services/${slug}`} />
            ) : (
              requests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="open" className={viewMode === "card" ? "space-y-3" : ""}>
            {openRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد طلبات مفتوحة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={openRequests} hrefBase={`/admin/services/${slug}`} />
            ) : (
              openRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
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
                  لا يوجد طلبات باجتماع مجدول
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={scheduledMeetingRequests}
                hrefBase={`/admin/services/${slug}`}
              />
            ) : (
              scheduledMeetingRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
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
                  لا يوجد طلبات في الانتظار
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={waitingRequests} hrefBase={`/admin/services/${slug}`} />
            ) : (
              waitingRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="in_progress" className={viewMode === "card" ? "space-y-3" : ""}>
            {inProgressRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد طلبات قيد المعالجة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable
                tickets={inProgressRequests}
                hrefBase={`/admin/services/${slug}`}
              />
            ) : (
              inProgressRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className={viewMode === "card" ? "space-y-3" : ""}>
            {resolvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد طلبات محلولة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={resolvedRequests} hrefBase={`/admin/services/${slug}`} />
            ) : (
              resolvedRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="closed" className={viewMode === "card" ? "space-y-3" : ""}>
            {closedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  لا يوجد طلبات مغلقة
                </CardContent>
              </Card>
            ) : viewMode === "table" ? (
              <TicketsTable tickets={closedRequests} hrefBase={`/admin/services/${slug}`} />
            ) : (
              closedRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/admin/services/${slug}`} />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
