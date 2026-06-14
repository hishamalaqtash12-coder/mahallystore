import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
    
    const res = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${userId}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 404 });
    }
    
    const user = await res.json();
    const meta = Object.fromEntries((user.meta_data || []).map((m) => [m.key, m.value]));
    
    const followed = meta.mahally_followed_stores ? JSON.parse(meta.mahally_followed_stores) : [];
    const parsedFollowed = followed.map(id => parseInt(id)).filter(Boolean);

    return new NextResponse(JSON.stringify({ followed: parsedFollowed }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("Follow Status API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch follow status" }, { status: 500 });
  }
}
