import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { StatsGrid } from "@/components/shared/stats-grid";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import { getMyServiceRequests } from "@/actions/service-requests";
import { getServiceBySlug } from "@/actions/services";
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

export default async function DashboardServicePage({
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
  await requireAuth();
  const { slug } = await params;
  const sp = await searchParams;

  const serviceResult = await getServiceBySlug(slug);
  if (!serviceResult.success || !serviceResult.data) notFound();
  const service = serviceResult.data;
  const Icon = iconForKey(service.iconKey);

  const filters = {
    status: sp.status,
    priority: sp.priority,
    search: sp.search,
  };
  const viewMode = sp.view === "card" ? "card" : "table";

  const requestsResult = await getMyServiceRequests(slug, filters);
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
      title: "مفتوحة",
      value: openRequests.length,
      icon: AlertCircle,      description: "في انتظار الإجراء",
    },
    {
      title: "قيد المعالجة",
      value: inProgressRequests.length,
      icon: Clock,      description: "قيد العمل حاليًا",
    },
    {
      title: "محلولة",
      value: resolvedRequests.length,
      icon: CheckCircle2,      description: "اكتمل",
    },
    {
      title: "الكل",
      value: requests.length,
      icon: Icon,      description: "جميع طلباتك",
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
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-foreground">{service.name}</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            إدارة طلبات {service.name.toLowerCase()} الخاصة بك
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/services/${slug}/new`}>
            <Plus className="h-4 w-4 me-2" />
            طلب جديد
          </Link>
        </Button>
      </div>

      <StatsGrid stats={stats} />

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

          <TabsContent value="all" className={viewMode === "card" ? "space-y-3" : ""}>
            {requests.length === 0 ? (
              <EmptySearchResults searchQuery={filters.search} entityName="طلبات" />
            ) : viewMode === "table" ? (
              <TicketsTable tickets={requests} hrefBase={`/dashboard/services/${slug}`} />
            ) : (
              requests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
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
              <TicketsTable tickets={openRequests} hrefBase={`/dashboard/services/${slug}`} />
            ) : (
              openRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
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
                hrefBase={`/dashboard/services/${slug}`}
              />
            ) : (
              scheduledMeetingRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
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
              <TicketsTable tickets={waitingRequests} hrefBase={`/dashboard/services/${slug}`} />
            ) : (
              waitingRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
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
                hrefBase={`/dashboard/services/${slug}`}
              />
            ) : (
              inProgressRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
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
              <TicketsTable tickets={resolvedRequests} hrefBase={`/dashboard/services/${slug}`} />
            ) : (
              resolvedRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
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
              <TicketsTable tickets={closedRequests} hrefBase={`/dashboard/services/${slug}`} />
            ) : (
              closedRequests.map((request) => (
                <div key={request._id.toString()}>
                  <TicketCard ticket={request} hrefBase={`/dashboard/services/${slug}`} />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
