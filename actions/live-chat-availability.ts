import {
  getLiveChatAvailability,
  getSupportAvailabilitySnapshot,
  isStaffRole,
  setLiveChatAvailability,
  type LiveChatAvailabilityStatus,
} from "@/lib/chat/availability";
import { getSession, requirePermission } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import {
  emitLiveChatAvailabilityChanged,
  emitSupportAvailabilityChanged,
} from "@/lib/socket/server";

export async function getOwnLiveChatAvailability(): Promise<{
  status: LiveChatAvailabilityStatus;
}> {
  const session = await requirePermission(["panel.admin.access", "panel.support.access"], {
    any: true,
  });
  const role = (session.user as SessionUser).role;
  if (!isStaffRole(role)) {
    throw new Error("غير مصرّح");
  }

  const status = await getLiveChatAvailability(session.user.id);
  return { status };
}

export async function updateOwnLiveChatAvailability(
  status: LiveChatAvailabilityStatus
): Promise<{ status: LiveChatAvailabilityStatus }> {
  const session = await requirePermission(["panel.admin.access", "panel.support.access"], {
    any: true,
  });
  const role = (session.user as SessionUser).role;
  if (!isStaffRole(role)) {
    throw new Error("غير مصرّح");
  }

  if (status !== "available" && status !== "unavailable") {
    throw new Error("حالة غير صالحة");
  }

  await setLiveChatAvailability(session.user.id, status);

  emitLiveChatAvailabilityChanged(session.user.id, status);
  await emitSupportAvailabilityChanged();

  return { status };
}

export async function readPublicSupportAvailability() {
  return getSupportAvailabilitySnapshot();
}
