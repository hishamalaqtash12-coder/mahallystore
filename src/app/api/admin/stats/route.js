import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
    const headers = { Authorization: `Basic ${auth}` };

    const [productsRes, ordersRes, vendorsRes] = await Promise.all([
      fetch(`${WP_URL}/wp-json/wc/v3/products?per_page=1`, { headers }),
      fetch(`${WP_URL}/wp-json/wc/v3/orders?per_page=100`, { headers }),
      fetch(`${WP_URL}/wp-json/wc/v3/customers?role=seller&per_page=1`, { headers })
    ]);

    const totalProducts = parseInt(productsRes.headers.get('x-wp-total') || '0');
    const totalOrders = parseInt(ordersRes.headers.get('x-wp-total') || '0');
    const totalVendors = parseInt(vendorsRes.headers.get('x-wp-total') || '0');

    const allOrders = await ordersRes.json();
    const completedOrders = Array.isArray(allOrders) ? allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'failed') : [];
    const calculatedRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2);

    const stats = {
      totalProducts,
      totalOrders,
      totalVendors,
      totalRevenue: calculatedRevenue,
      monthlyRevenue: calculatedRevenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
