import { persistMessage } from "@/lib/messages";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { fromId, toId, text, metadata } = await request.json();

    if (!fromId || !toId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const message = await persistMessage({
      fromId,
      toId,
      text,
      metadata: metadata || {}
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Send Message API error:", error.message);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
