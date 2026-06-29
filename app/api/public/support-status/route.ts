import { NextResponse } from "next/server";

import { readPublicSupportAvailability } from "@/actions/live-chat-availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await readPublicSupportAvailability();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("support-status error:", error);
    return NextResponse.json({
      online: false,
      count: 0,
      availableCount: 0,
      connectedCount: 0,
      readyCount: 0,
    });
  }
}
