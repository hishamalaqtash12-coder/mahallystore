import { NextResponse } from "next/server";

// wcApi.post is a no-op stub — bypass it and call WC REST directly
const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, "");
const getAuth = () =>
  Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wc/v3/products/brands?per_page=100&orderby=name&order=asc`,
      { headers: { Authorization: `Basic ${getAuth()}` }, cache: "no-store" }
    );
    if (!res.ok) {
      // Brands plugin may not be installed — return empty array gracefully
      console.warn("Brands GET: WC API returned", res.status, "(plugin may not be active)");
      return NextResponse.json([]);
    }
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.warn("Brands GET error (plugin may not be installed):", error.message);
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

    const res = await fetch(`${WP_URL}/wp-json/wc/v3/products/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getAuth()}`,
      },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to create brand");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Brands POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
