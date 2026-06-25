import { ObjectId } from "mongodb";

import { getCollection } from "@/lib/db";
import { getOnlineUserIds } from "@/lib/socket/server";
import type { User } from "@/types";
import type { UserRole } from "@/types";

export type StaffMember = {
  userId: string;
  role: Extract<UserRole, "admin" | "support">;
};

export function resolveStaffUserId(user: Pick<User, "id" | "_id">): string | null {
  const explicitId = user.id?.trim();
  if (explicitId) return explicitId;

  if (user._id) {
    return user._id.toString();
  }

  return null;
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  const usersCollection = await getCollection<User>("user");
  const staff = await usersCollection
    .find({ role: { $in: ["support", "admin"] } })
    .project({ id: 1, _id: 1, role: 1 })
    .toArray();

  const members: StaffMember[] = [];
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

export async function getSupportOnlineStatus(): Promise<{
  online: boolean;
  count: number;
}> {
  const onlineIds = getOnlineUserIds();
  if (onlineIds.length === 0) {
    return { online: false, count: 0 };
  }

  const staffMembers = await getStaffMembers();
  const staffIds = new Set(staffMembers.map((member) => member.userId));
  const onlineStaffCount = onlineIds.filter((id) => staffIds.has(id)).length;

  return {
    online: onlineStaffCount > 0,
    count: onlineStaffCount,
  };
}

export async function getOnlineStaffUserIds(): Promise<string[]> {
  const onlineIds = new Set(getOnlineUserIds());
  if (onlineIds.size === 0) return [];

  const staffMembers = await getStaffMembers();
  return staffMembers
    .map((member) => member.userId)
    .filter((userId) => onlineIds.has(userId));
}

export async function getAllStaffUserIds(): Promise<string[]> {
  const staffMembers = await getStaffMembers();
  return staffMembers.map((member) => member.userId);
}

export async function findStaffMembersByIds(
  userIds: string[]
): Promise<StaffMember[]> {
  if (userIds.length === 0) {
    return getStaffMembers();
  }

  const objectIds = userIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const usersCollection = await getCollection<User>("user");
  const staff = await usersCollection
    .find({
      role: { $in: ["support", "admin"] },
      $or: [
        { id: { $in: userIds } },
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      ],
    })
    .project({ id: 1, _id: 1, role: 1 })
    .toArray();

  const members: StaffMember[] = [];
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
