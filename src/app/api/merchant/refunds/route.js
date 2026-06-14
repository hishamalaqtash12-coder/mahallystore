import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get("wooId");

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    try {
      const data = await dokanApi.getRefunds(wooId);
      const filteredRefunds = (Array.isArray(data) ? data : []).filter(r => String(r.vendor_id || r.seller_id) === String(wooId));
      return NextResponse.json(filteredRefunds);
    } catch (err) {
      console.warn("Refunds fetch restricted, returning empty list:", err.message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Critical refunds error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
