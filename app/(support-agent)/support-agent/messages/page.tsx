/**
 * Support Agent Messages Page
 *
 * Real-time messaging interface for support agents.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import { MessagesClient } from "@/components/chat/messages-client";

export const metadata = {
  title: "الرسائل | Support Agent",
  description: "مراسلة فورية",
};

export default async function SupportAgentMessagesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as SessionUser).role || "customer";
  if (userRole !== "support" && userRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <MessagesClient userId={session.user.id} userRole={userRole} />
  );
}
