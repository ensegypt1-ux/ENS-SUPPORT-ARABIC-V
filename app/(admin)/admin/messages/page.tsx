/**
 * Admin Messages Page
 *
 * Real-time messaging interface for administrators.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import { ChatInboxPageSkeleton } from "@/components/ui/loading";
import { MessagesClient } from "@/components/chat/messages-client";

export const metadata = {
  title: "الرسائل | لوحة الإدارة",
  description: "مراسلة فورية مع العملاء وفريق الدعم",
};

export default async function AdminMessagesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as SessionUser).role;
  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<ChatInboxPageSkeleton />}>
      <MessagesClient
        userId={session.user.id}
        userRole={userRole}
      />
    </Suspense>
  );
}
