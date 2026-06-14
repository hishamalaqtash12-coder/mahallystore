import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const per_page = searchParams.get("per_page") || 20;
    const page = searchParams.get("page") || 1;
    const status = searchParams.get("status") || "any";

    const params = {
      per_page,
      page,
      status: status === "all" ? "any" : status,
    };

    const res = await wcApi.get("orders", params);
    
    const orders = (res.data || []).map(o => ({
      id: `ORD-${o.id}`,
      customer: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim() || o.customer_note || "Guest",
      date: new Date(o.date_created).toLocaleDateString(),
      total: `${o.total} ${o.currency || "JOD"}`,
      status: o.status,
      items: o.line_items?.length || 0
    }));

    return NextResponse.json({ 
      orders, 
      total: parseInt(res.headers['x-wp-total'] || '0'),
      pages: parseInt(res.headers['x-wp-totalpages'] || '0')
    });
  } catch (error) {
    console.error("Orders API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
