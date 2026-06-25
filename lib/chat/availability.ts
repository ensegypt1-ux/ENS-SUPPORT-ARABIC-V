import { ObjectId } from "mongodb";

import { getCollection } from "@/lib/db";
import { getOnlineUserIds } from "@/lib/socket/server";
import type { User, UserRole } from "@/types";

/** Explicit opt-in for receiving guest live chat — separate from socket connection. */
export type LiveChatAvailabilityStatus = "available" | "unavailable";

export interface LiveChatAvailabilityRecord {
  status: LiveChatAvailabilityStatus;
  updatedAt: Date;
}

export type SupportAvailabilitySnapshot = {
  /** True when at least one agent is available AND connected (customer-facing). */
  online: boolean;
  /** Agents ready to take live chat right now. */
  count: number;
  /** Agents who opted in to live chat (may be disconnected). */
  availableCount: number;
  /** Staff with an active platform connection. */
  connectedCount: number;
};

const STAFF_ROLES: UserRole[] = ["admin", "support"];

export function isStaffRole(role: string | undefined): role is "admin" | "support" {
  return role === "admin" || role === "support";
}

export function resolveStaffUserId(user: Pick<User, "id" | "_id">): string | null {
  const explicitId = user.id?.trim();
  if (explicitId) return explicitId;

  if (user._id) {
    return user._id.toString();
  }

  return null;
}

export async function getStaffMembers(): Promise<
  Array<{ userId: string; role: Extract<UserRole, "admin" | "support"> }>
> {
  const usersCollection = await getCollection<User>("user");
  const staff = await usersCollection
    .find({ role: { $in: STAFF_ROLES } })
    .project({ id: 1, _id: 1, role: 1 })
    .toArray();

  const members: Array<{
    userId: string;
    role: Extract<UserRole, "admin" | "support">;
  }> = [];
  const seen = new Set<string>();

  for (const user of staff) {
    const userId = resolveStaffUserId(user as Pick<User, "id" | "_id">);
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    members.push({
      userId,
      role: user.role === "admin" ? "admin" : "support",
    });
  }

  return members;
}

export async function getLiveChatAvailability(
  userId: string
): Promise<LiveChatAvailabilityStatus> {
  const usersCollection = await getCollection<User>("user");
  const user = await usersCollection.findOne(
    ObjectId.isValid(userId)
      ? { $or: [{ id: userId }, { _id: new ObjectId(userId) }] }
      : { id: userId },
    { projection: { liveChatAvailability: 1 } }
  );

  return user?.liveChatAvailability?.status ?? "unavailable";
}

/**
 * Available only counts while the agent is actively connected.
 * Stale "available" rows (e.g. after closing the browser) revert to unavailable.
 */
export async function reconcileLiveChatAvailabilityWithConnection(
  userId: string
): Promise<LiveChatAvailabilityStatus> {
  const status = await getLiveChatAvailability(userId);
  if (status !== "available") {
    return "unavailable";
  }

  if (getOnlineUserIds().includes(userId)) {
    return "available";
  }

  await setLiveChatAvailability(userId, "unavailable");
  return "unavailable";
}

export async function markStaffLiveChatUnavailable(
  userId: string
): Promise<LiveChatAvailabilityStatus> {
  const status = await getLiveChatAvailability(userId);
  if (status === "unavailable") {
    return "unavailable";
  }
  await setLiveChatAvailability(userId, "unavailable");
  return "unavailable";
}

export async function setLiveChatAvailability(
  userId: string,
  status: LiveChatAvailabilityStatus
): Promise<LiveChatAvailabilityRecord> {
  const usersCollection = await getCollection<User>("user");
  const updatedAt = new Date();
  const record: LiveChatAvailabilityRecord = { status, updatedAt };

  await usersCollection.updateOne(
    ObjectId.isValid(userId)
      ? { $or: [{ id: userId }, { _id: new ObjectId(userId) }] }
      : { id: userId },
    {
      $set: {
        liveChatAvailability: record,
        updatedAt,
      },
    }
  );

  return record;
}

/** Staff who explicitly opted in to live chat. */
export async function getAvailableStaffUserIds(): Promise<string[]> {
  const usersCollection = await getCollection<User>("user");
  const staff = await usersCollection
    .find({
      role: { $in: STAFF_ROLES },
      "liveChatAvailability.status": "available",
    })
    .project({ id: 1, _id: 1 })
    .toArray();

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const user of staff) {
    const userId = resolveStaffUserId(user as Pick<User, "id" | "_id">);
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    ids.push(userId);
  }

  return ids;
}

export async function getConnectedStaffUserIds(): Promise<string[]> {
  const onlineIds = new Set(getOnlineUserIds());
  if (onlineIds.size === 0) return [];

  const staffMembers = await getStaffMembers();
  return staffMembers
    .map((member) => member.userId)
    .filter((userId) => onlineIds.has(userId));
}

/** Available for live chat = opted in AND actively connected. */
export async function getLiveChatReadyStaffUserIds(): Promise<string[]> {
  const [availableIds, connectedIds] = await Promise.all([
    getAvailableStaffUserIds(),
    getConnectedStaffUserIds(),
  ]);

  if (availableIds.length === 0 || connectedIds.length === 0) {
    return [];
  }

  const connectedSet = new Set(connectedIds);
  return availableIds.filter((id) => connectedSet.has(id));
}

export async function getSupportAvailabilitySnapshot(): Promise<SupportAvailabilitySnapshot> {
  const [readyIds, availableIds, connectedIds] = await Promise.all([
    getLiveChatReadyStaffUserIds(),
    getAvailableStaffUserIds(),
    getConnectedStaffUserIds(),
  ]);

  return {
    online: readyIds.length > 0,
    count: readyIds.length,
    availableCount: availableIds.length,
    connectedCount: connectedIds.length,
  };
}

/** Customer-facing gate for new guest live chat sessions. */
export async function getSupportOnlineStatus(): Promise<{
  online: boolean;
  count: number;
}> {
  const snapshot = await getSupportAvailabilitySnapshot();
  return { online: snapshot.online, count: snapshot.count };
}

export async function getAllStaffUserIds(): Promise<string[]> {
  const staffMembers = await getStaffMembers();
  return staffMembers.map((member) => member.userId);
}

export async function findStaffMembersByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return getStaffMembers();
  }

  const objectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const usersCollection = await getCollection<User>("user");
  const staff = await usersCollection
    .find({
      role: { $in: STAFF_ROLES },
      $or: [
        { id: { $in: userIds } },
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      ],
    })
    .project({ id: 1, _id: 1, role: 1 })
    .toArray();

  const members: Array<{
    userId: string;
    role: Extract<UserRole, "admin" | "support">;
  }> = [];
  const seen = new Set<string>();

  for (const user of staff) {
    const userId = resolveStaffUserId(user as Pick<User, "id" | "_id">);
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);
    members.push({
      userId,
      role: user.role === "admin" ? "admin" : "support",
    });
  }

  return members;
}
