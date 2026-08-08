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
    
    // Only count STRICTLY completed orders
    const completedOrders = Array.isArray(allOrders) ? allOrders.filter(o => o.status === 'completed') : [];
    
    let totalGMV = 0;
    let totalAdminCommission = 0;

    completedOrders.forEach(o => {
      const orderTotal = parseFloat(o.total || 0);
      totalGMV += orderTotal;

      o.line_items.forEach(item => {
        const itemTotal = parseFloat(item.total || 0);
        const metaType = item.meta_data.find(m => m.key === '_dokan_commission_type')?.value;
        const metaRate = parseFloat(item.meta_data.find(m => m.key === '_dokan_commission_rate')?.value || 0);
        const metaFee = parseFloat(item.meta_data.find(m => m.key === '_dokan_additional_fee')?.value || 0);
        
        let itemComm = 0;
        if (metaType === 'percentage' || metaType === 'flat') {
            itemComm = (itemTotal * (metaRate / 100)) + metaFee;
        } else if (metaType === 'fixed') {
            itemComm = metaFee;
        } else {
            itemComm = (itemTotal * (metaRate / 100)) + metaFee;
        }

        // Cap commission so it doesn't exceed the item total (handles JOD 1 fee on 0-value items)
        if (itemComm > itemTotal) {
          itemComm = itemTotal;
        }

        totalAdminCommission += itemComm;
      });
    });

    const totalVendorEarnings = totalGMV - totalAdminCommission;

    const stats = {
      totalProducts,
      totalOrders,
      totalVendors,
      totalGMV: totalGMV.toFixed(2),
      adminRevenue: totalAdminCommission.toFixed(2),
      vendorEarnings: totalVendorEarnings.toFixed(2),
      // keep backward compatibility just in case other things use it
      totalRevenue: totalAdminCommission.toFixed(2), 
      monthlyRevenue: totalAdminCommission.toFixed(2),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats API Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
