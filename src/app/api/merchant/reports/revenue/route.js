import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";

// Helper: check if a line item belongs to this vendor
function isVendorLineItem(item, vendorId) {
  const vid = String(vendorId);
  const itemVendorId = item.meta_data?.find(m =>
    m.key === '_vendor_id' || m.key === '_dokan_vendor_id'
  )?.value;
  return String(itemVendorId) === vid;
}

// Helper: check if an order belongs to (or contains items from) this vendor
function isVendorOrder(order, vendorId) {
  const vid = String(vendorId);

  // Check order-level vendor meta
  const orderVendorId = order.meta_data?.find(m =>
    m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id'
  )?.value;
  if (String(orderVendorId) === vid) return true;

  // Check if any line item belongs to this vendor
  return (order.line_items || []).some(item => isVendorLineItem(item, vendorId));
}

// Helper: extract only this vendor's line items from an order
function getVendorLineItems(order, vendorId) {
  const vid = String(vendorId);

  // If the entire order is tagged to this vendor, all items are theirs
  const orderVendorId = order.meta_data?.find(m =>
    m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id'
  )?.value;
  if (String(orderVendorId) === vid) return order.line_items || [];

  // Otherwise filter to only items with matching vendor meta
  return (order.line_items || []).filter(item => isVendorLineItem(item, vendorId));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get("wooId");

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor identification" }, { status: 400 });
    }

    const emptyResponse = { report: [], summary: { totalGross: "0.00", totalNet: "0.00", orderCount: 0, avgOrderValue: "0.00" }, topProducts: [], chartData: [] };

    const daysCount = parseInt(searchParams.get("days") || "7");
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysCount);

    let allOrders = [];
    try {
      // Fetch orders via Dokan REST API
      const data = await dokanApi.getOrders(wooId, { per_page: 100 });
      allOrders = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Reports: Orders fetch restricted, returning empty report:", err.message);
      return NextResponse.json(emptyResponse);
    }

    // STRICT DATA ISOLATION: Only keep orders that belong to this vendor
    const isolatedOrders = allOrders.filter(order => isVendorOrder(order, wooId));

    // Filter by date range
    const filteredOrders = isolatedOrders.filter(o => new Date(o.date_created) >= startDate);

    const reportData = filteredOrders.map(order => {
      // Only sum revenue from this vendor's line items (not the full order total)
      const vendorItems = getVendorLineItems(order, wooId);
      const gross = vendorItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
      const net = parseFloat(order.earning || gross * 0.9);
      return {
        id: order.id,
        "Order ID": `#${order.id}`,
        "Date": new Date(order.date_created).toLocaleDateString(),
        "RawDate": order.date_created,
        "Customer": `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() || "Guest",
        "Items": vendorItems.map(li => `${li.name} (x${li.quantity})`).join(", ") || "No items",
        "Gross Revenue (JOD)": gross.toFixed(2),
        "Net Earnings (JOD)": net.toFixed(2),
        "Status": order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown",
        "Payment Method": order.payment_method_title || "N/A",
        line_items: vendorItems
      };
    });

    // 1. Calculate Summary Stats
    const totalGross = reportData.reduce((sum, r) => sum + parseFloat(r["Gross Revenue (JOD)"]), 0);
    const totalNet = reportData.reduce((sum, r) => sum + parseFloat(r["Net Earnings (JOD)"]), 0);
    const orderCount = reportData.length;
    const avgOrderValue = orderCount > 0 ? totalGross / orderCount : 0;

    // 2. Calculate Top Products (only from this vendor's line items)
    const productStats = {};
    isolatedOrders.forEach(order => {
      const vendorItems = getVendorLineItems(order, wooId);
      vendorItems.forEach(item => {
        if (!productStats[item.product_id]) {
          productStats[item.product_id] = { name: item.name, sales: 0, revenue: 0 };
        }
        productStats[item.product_id].sales += item.quantity;
        productStats[item.product_id].revenue += parseFloat(item.total);
      });
    });
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 3. Generate Chronological Chart Data
    const chartData = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('sv-SE');
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayOrders = filteredOrders.filter(o => o.date_created.startsWith(dateStr));
      // Sum only vendor's line items for chart data
      let gross = 0;
      let net = 0;
      dayOrders.forEach(o => {
        const vendorItems = getVendorLineItems(o, wooId);
        const orderGross = vendorItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
        gross += orderGross;
        net += parseFloat(o.earning || orderGross * 0.9);
      });
      
      chartData.push({ day: label, date: dateStr, gross: gross.toFixed(2), net: net.toFixed(2) });
    }

    return NextResponse.json({ 
      report: reportData,
      summary: {
        totalGross: totalGross.toFixed(2),
        totalNet: totalNet.toFixed(2),
        orderCount,
        avgOrderValue: avgOrderValue.toFixed(2)
      },
      topProducts,
      chartData
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ report: [], summary: { totalGross: "0.00", totalNet: "0.00", orderCount: 0, avgOrderValue: "0.00" }, topProducts: [], chartData: [] }, { status: 200 });
  }
}
