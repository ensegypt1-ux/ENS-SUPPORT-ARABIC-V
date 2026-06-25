import type { User } from "@/types";
import { Card } from "@/components/ui/card";
import { getAllUsers } from "@/actions/admin";
import { listRbacRoles } from "@/lib/rbac-store";
import { UserCard } from "@/components/admin/user-card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StatsGrid } from "@/components/shared/stats-grid";
import { UsersTable } from "@/components/admin/users-table";
import { ViewToggle } from "@/components/tickets/view-toggle";
import { getTicketDepartments } from "@/actions/ticket-departments";
import { Users, Headset, ShieldAlert, UserCog } from "lucide-react";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { CreateUserButton } from "@/components/admin/create-user-button";
import { EmptySearchResults } from "@/components/shared/empty-search-results";

// Disable static generation for this page since it has dynamic data
export const dynamic = "force-dynamic";

type TeamMember = User & {
  rbacRoleName?: string;
  isCustomRole: boolean;
  departmentNames: string[];
};

interface UsersPageProps {
  searchParams: Promise<{
    role?: string;
    search?: string;
    view?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const filters = {
    role: params.role,
    search: params.search,
  };

  // Get users with filters
  const usersResult = await getAllUsers(filters);
  const users = usersResult.success ? usersResult.data || [] : [];

  // Serialize users to remove MongoDB ObjectId
  const serializedUsers: User[] = JSON.parse(JSON.stringify(users));

  // Build a map of custom (non-system) RBAC roles so we can label and bucket
  // users that have been assigned a custom role.
  const rbacRoles = await listRbacRoles();
  const customRoleNames = new Map<string, string>();
  for (const role of rbacRoles) {
    if (!role.isSystem) {
      customRoleNames.set(role._id.toString(), role.name);
    }
  }

  // Map department slugs to display names so support staff coverage is readable.
  const departmentsResult = await getTicketDepartments();
  const departmentNameBySlug = new Map<string, string>();
  if (departmentsResult.success && departmentsResult.data) {
    for (const dept of departmentsResult.data) {
      departmentNameBySlug.set(dept.slug, dept.name);
    }
  }

  // Enrich each user with their custom role name and department names (if any).
  const enrichedUsers: TeamMember[] = serializedUsers.map((u) => {
    const rbacRoleName = u.rbacRoleId
      ? customRoleNames.get(u.rbacRoleId)
      : undefined;
    const departmentNames = (u.departmentSlugs || []).map(
      (slug) => departmentNameBySlug.get(slug) || slug
    );
    return {
      ...u,
      rbacRoleName,
      isCustomRole: Boolean(rbacRoleName),
      departmentNames,
    };
  });

  const viewMode = params.view === "card" ? "card" : "table";

  // Team members = everyone who is not a customer (admins, support, custom roles).
  const teamMembers = enrichedUsers.filter((u) => u.role !== "customer");

  // Mutually exclusive buckets so counts sum to the total. A user assigned a
  // custom role is grouped under "أدوار مخصصة"; default admins/support keep
  // their base-role bucket.
  const customRoleUsers = teamMembers.filter((u) => u.isCustomRole);
  const adminUsers = teamMembers.filter(
    (u) => u.role === "admin" && !u.isCustomRole
  );
  const supportUsers = teamMembers.filter(
    (u) => u.role === "support" && !u.isCustomRole
  );

  const userStats = [
    {
      title: "أعضاء الفريق",
      value: teamMembers.length,
      icon: Users,
      description: "المسؤولون ووكلاء الدعم والأدوار المخصصة",
    },
    {
      title: "المسؤولون",
      value: adminUsers.length,
      icon: ShieldAlert,
      description: "مسؤوإذا النظام",
    },
    {
      title: "فريق الدعم",
      value: supportUsers.length,
      icon: Headset,
      description: "وكلاء الدعم",
    },
    {
      title: "أدوار مخصصة",
      value: customRoleUsers.length,
      icon: UserCog,
      description: "أدوار صلاحيات مخصصة",
    },
  ];

  const tabItems = [
    { value: "all", label: "جميع أعضاء الفريق", count: teamMembers.length },
    { value: "admin", label: "المسؤولون", count: adminUsers.length },
    { value: "support", label: "فريق الدعم", count: supportUsers.length },
    { value: "custom", label: "أدوار مخصصة", count: customRoleUsers.length },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <AdminPageHeader
        title="أعضاء الفريق"
        description="إدارة حسابات المسؤولين ووكلاء الدعم والأدوار المخصصة"
        actions={<CreateUserButton />}
      />

      {/* Statistics */}
      <StatsGrid stats={userStats} />

      {/* Team Members List */}
      <Card className="rounded-lg p-4">
        <Tabs defaultValue="all">
          <PageTabsHeader
            tabs={tabItems}
            showSearch
            searchPlaceholder="بحث في أعضاء الفريق..."
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
            {teamMembers.length === 0 ? (
              <EmptySearchResults
                searchQuery={filters.search}
                entityName="أعضاء الفريق"
              />
            ) : viewMode === "table" ? (
              <UsersTable users={teamMembers} />
            ) : (
              teamMembers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent
            value="admin"
            className={
              viewMode === "card"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : ""
            }
          >
            {adminUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                لا يوجد مسؤولين
              </div>
            ) : viewMode === "table" ? (
              <UsersTable users={adminUsers} />
            ) : (
              adminUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent
            value="support"
            className={
              viewMode === "card"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : ""
            }
          >
            {supportUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                لا يوجد فريق دعم
              </div>
            ) : viewMode === "table" ? (
              <UsersTable users={supportUsers} />
            ) : (
              supportUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>

          <TabsContent
            value="custom"
            className={
              viewMode === "card"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : ""
            }
          >
            {customRoleUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                لا يوجد أعضاء بأدوار مخصصة
              </div>
            ) : viewMode === "table" ? (
              <UsersTable users={customRoleUsers} />
            ) : (
              customRoleUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
