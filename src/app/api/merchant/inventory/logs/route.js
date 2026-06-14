import { NextResponse } from "next/server";
import { getProducts } from "@/lib/woocommerce";
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (!email && !phone) {
      return NextResponse.json({ error: "Missing merchant identification" }, { status: 400 });
    }

    // 1. Fetch Merchant Products
    const { data: allProducts } = await getProducts({ per_page: 100 });
    const merchantProducts = allProducts.filter(p => {
      const pEmail = p.meta_data?.find(m => m.key === "merchant_email")?.value;
      const pPhone = p.meta_data?.find(m => m.key === "merchant_phone")?.value;
      return (email && pEmail === email) || (phone && pPhone === phone);
    });
    
    const merchantProductIds = new Set(merchantProducts.map(p => p.id));
    const productIdToName = Object.fromEntries(merchantProducts.map(p => [p.id, p.name]));

    // Fetch Sale Logs from Order History
    const ordersRes = await api.get("orders", { per_page: 100, status: "any" });
    const allOrders = ordersRes.data;

    const logs = [];

    // 2. Process each merchant product individually to build an accurate ledger
    merchantProducts.forEach(p => {
      const productEvents = [];
      const currentStock = p.stock_quantity || 0;

      // A. Add Manual Logs from Metadata
      const history = p.meta_data?.find(m => m.key === "mahally_stock_history")?.value;
      if (history) {
        try {
          const historyArr = typeof history === 'string' ? JSON.parse(history) : history;
          historyArr.forEach(entry => {
            productEvents.push({
              id: `manual-${p.id}-${entry.date}`,
              product_id: p.id,
              product_name: p.name,
              type: "Adjustment",
              event: "Manual Update",
              customer: "Merchant (Self)",
              quantity_num: entry.change,
              quantity: entry.change > 0 ? `+${entry.change}` : entry.change,
              balance: entry.new,
              date: entry.date,
              status: "Success",
              note: entry.note
            });
          });
        } catch (e) {}
      }

      // B. Add Sale Logs from Order History
      allOrders.forEach(order => {
        const item = order.line_items.find(li => li.product_id === p.id);
        if (item) {
          productEvents.push({
            id: `sale-${order.id}-${p.id}`,
            product_id: p.id,
            product_name: p.name,
            type: "Sale",
            event: `Order #${order.id}`,
            customer: `${order.billing.first_name} ${order.billing.last_name}`,
            quantity_num: -item.quantity,
            quantity: `-${item.quantity}`,
            balance: 0, // Placeholder
            date: order.date_created,
            status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
            note: `Sold via Mahally Marketplace`
          });
        }
      });

      // C. Calculate Running Balance
      // Sort events by date DESC (newest first)
      productEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

      let runningBal = currentStock;
      productEvents.forEach((event, index) => {
        // If it's a manual adjustment, the balance is already in the meta (entry.new)
        // But for sales, we calculate based on the current stock and subsequent events.
        if (event.type === "Adjustment") {
          runningBal = event.balance - event.quantity_num; // Go back in time
        } else {
          event.balance = runningBal;
          runningBal = runningBal - event.quantity_num; // Go back in time (subtract negative = add)
        }
        logs.push(event);
      });
    });

    // Final sort for the entire log list
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Inventory logs error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory logs" }, { status: 500 });
  }
}
