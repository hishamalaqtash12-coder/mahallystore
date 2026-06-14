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
      // Announcements are usually for all vendors
      const data = await dokanApi.getAnnouncements(wooId);
      return NextResponse.json(data);
    } catch (err) {
      console.warn("Announcements fetch restricted, returning empty list:", err.message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Critical announcements error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
