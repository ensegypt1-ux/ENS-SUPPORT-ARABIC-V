import { redirect } from "next/navigation";

import { OperationsCenterClient } from "@/components/operations/operations-center-client";
import { DashboardGreeting } from "@/components/shared/dashboard-greeting";
import { getGreeting } from "@/lib/greeting";
import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";

export const metadata = {
  title: "مركز العمليات | لوحة الإدارة",
  description: "مراقبة تشغيلية مباشرة لعمليات دعم ENS",
};

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as SessionUser).role;
  if (userRole !== "admin" && userRole !== "support") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-5">
      <DashboardGreeting
        name={session.user.name ?? null}
        initialGreeting={getGreeting()}
        subtitle="مركز العمليات — رؤية مباشرة لمحادثات الزوار والتذاكر وفريق الدعم."
      />
      <OperationsCenterClient userId={session.user.id} />
    </div>
  );
}
