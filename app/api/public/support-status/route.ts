import { NextResponse } from "next/server";

import { getSupportOnlineStatus } from "@/lib/socket/presence-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getSupportOnlineStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("support-status error:", error);
    return NextResponse.json({ online: false, count: 0 });
  }
}
