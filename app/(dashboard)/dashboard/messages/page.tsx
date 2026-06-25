/**
 * Messages Page
 *
 * Real-time messaging interface with conversations, messages, and presence.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import { ChatInboxPageSkeleton } from "@/components/ui/loading";
import { MessagesClient } from "@/components/chat/messages-client";

export const metadata = {
  title: "الرسائل | تطبيق الدعم",
  description: "مراسلة فورية",
};

export default async function MessagesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userRole = (session.user as SessionUser).role || "customer";

  return (
    <Suspense fallback={<ChatInboxPageSkeleton />}>
      <MessagesClient userId={session.user.id} userRole={userRole} />
    </Suspense>
  );
}
