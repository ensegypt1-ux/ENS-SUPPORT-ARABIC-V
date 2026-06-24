import { Card } from "@/components/ui/card";
import { getClientUsers } from "@/actions/admin";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StatsGrid } from "@/components/shared/stats-grid";
import { ClientCard } from "@/components/admin/client-card";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { ClientsTable } from "@/components/admin/clients-table";
import { Users, Ticket, Clock, CheckCircle2 } from "lucide-react";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { CreateCustomerButton } from "@/components/admin/create-customer-button";

// Disable static generation for this page since it has dynamic data
export const dynamic = "force-dynamic";

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
    view?: string;
  }>;
}

export default async function AdminCustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;
  const filters = {
    search: params.search,
  };

  // Get client users with ticket statistics
  const clientsResult = await getClientUsers(filters);
  const clients = clientsResult.success ? clientsResult.data || [] : [];

  // Serialize clients to remove MongoDB ObjectId
  const serializedClients = JSON.parse(JSON.stringify(clients));

  const viewMode = params.view === "card" ? "card" : "table";

  // Calculate statistics
  const totalCustomers = serializedClients.length;
  const totalTickets = serializedClients.reduce(
    (sum: number, client: any) => sum + client.ticketCount,
    0,
  );
  const totalOpenTickets = serializedClients.reduce(
    (sum: number, client: any) => sum + client.openTickets,
    0,
  );
  const totalResolvedTickets = serializedClients.reduce(
    (sum: number, client: any) => sum + client.resolvedTickets,
    0,
  );
  const activeClients = serializedClients.filter(
    (client: any) => client.ticketCount > 0,
  ).length;

  const clientStats = [
    {
      title: "إجمالي العملاء",
      value: totalCustomers,
      icon: Users,
      iconColor: "text-slate-600",
      iconBgColor: "bg-slate-50 dark:bg-slate-950",
      description: `${activeClients} عميل لديه تذاكر نشطة`,
    },
    {
      title: "إجمالي التذاكر",
      value: totalTickets,
      icon: Ticket,
      iconColor: "text-indigo-600",
      iconBgColor: "bg-indigo-50 dark:bg-indigo-950",
      description: "عبر جميع العملاء",
    },
    {
      title: "تذاكر مفتوحة",
      value: totalOpenTickets,
      icon: Clock,
      iconColor: "text-amber-600",
      iconBgColor: "bg-amber-50 dark:bg-amber-950",
      description: "في انتظار الحل",
    },
    {
      title: "تذاكر محلولة",
      value: totalResolvedTickets,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBgColor: "bg-emerald-50 dark:bg-emerald-950",
      description: "اتقفلت",
    },
  ];

  const tabItems = [
    { value: "all", label: "جميع العملاء", count: serializedClients.length },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <AdminPageHeader
        title="العملاء"
        description="إدارة حسابات العملاء ومتابعة نشاط الدعم"
        actions={<CreateCustomerButton />}
      />

      {/* Statistics */}
      <StatsGrid stats={clientStats} />

      {/* Customers List */}
      <Card className="rounded-lg p-4">
        <Tabs defaultValue="all">
          <PageTabsHeader
            tabs={tabItems}
            showSearch
            searchPlaceholder="بحث في العملاء..."
            searchDefaultValue={filters.search}
            rightActions={<ViewToggle />}
          />

          <TabsContent
            value="all"
            className={
              viewMode === "card"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : ""
            }
          >
            {serializedClients.length === 0 ? (
              <EmptySearchResults
                searchQuery={filters.search}
                entityName="العملاء"
              />
            ) : viewMode === "table" ? (
              <ClientsTable clients={serializedClients} />
            ) : (
              serializedClients.map((client: any) => (
                <ClientCard key={client.id} client={client} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
