"use server";

import { buildOperationsCenterSnapshot } from "@/lib/operations/metrics";
import type { OperationsCenterSnapshot } from "@/lib/operations/types";
import type { ApiResponse } from "@/types";
import { getSession } from "@/lib/auth-utils";
import type { User } from "@/types";

async function requireOperationsAccess() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("غير مصرّح");
  }

  const role = ((session.user as User).role || "customer") as string;
  if (role !== "admin" && role !== "support") {
    throw new Error("ممنوع");
  }

  return session;
}

export async function getOperationsCenterSnapshotAction(): Promise<
  ApiResponse<OperationsCenterSnapshot>
> {
  try {
    await requireOperationsAccess();
    const data = await buildOperationsCenterSnapshot();
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذّر تحميل مركز العمليات";
    return { success: false, error: message };
  }
}
