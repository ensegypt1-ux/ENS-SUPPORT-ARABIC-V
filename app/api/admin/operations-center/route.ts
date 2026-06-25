import { NextResponse } from "next/server";

import { getOperationsCenterSnapshotAction } from "@/actions/operations-center";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getOperationsCenterSnapshotAction();

  if (!result.success || !result.data) {
    return NextResponse.json(
      { success: false, error: result.error || "تعذّر تحميل مركز العمليات" },
      { status: result.error === "غير مصرّح" || result.error === "ممنوع" ? 403 : 500 }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
