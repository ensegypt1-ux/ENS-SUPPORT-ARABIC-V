/**
 * @deprecated Import from `@/lib/chat/availability` instead.
 * Re-exports preserved for existing imports during migration.
 */
export {
  getStaffMembers,
  getSupportAvailabilitySnapshot,
  getLiveChatReadyStaffUserIds as getOnlineStaffUserIds,
  getConnectedStaffUserIds,
  getAvailableStaffUserIds,
  getAllStaffUserIds,
  findStaffMembersByIds,
  resolveStaffUserId,
  type SupportAvailabilitySnapshot,
} from "@/lib/chat/availability";

import { getSupportAvailabilitySnapshot } from "@/lib/chat/availability";

/** Customer-facing live chat readiness (available + connected). */
export async function getSupportOnlineStatus(): Promise<{
  online: boolean;
  count: number;
}> {
  const snapshot = await getSupportAvailabilitySnapshot();
  return { online: snapshot.online, count: snapshot.count };
}

export type StaffMember = {
  userId: string;
  role: "admin" | "support";
};
