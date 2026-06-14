import { NextResponse } from "next/server";
import { wcApi } from "@/lib/woocommerce";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get('wooId');
    
    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    let orders = [];
    try {
      const { dokanApi } = await import("@/lib/dokan");
      orders = await dokanApi.getOrders(wooId, { per_page: 50 });
      if (orders && !Array.isArray(orders) && orders.code) {
        throw new Error(orders.message);
      }
    } catch (e) {
      console.warn("Dokan order fetch failed, using WC fallback:", e.message);
      const wcRes = await wcApi.get("orders", { per_page: 50, vendor: wooId });
      orders = wcRes.data || [];
    }

    // 2. STRICT DATA ISOLATION: Final safety filter
    const finalOrders = (Array.isArray(orders) ? orders : []).filter(order => {
      // Check order level vendor ID
      const orderVendorId = order.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      if (String(orderVendorId) === String(wooId)) return true;

      // Check if any line item belongs to this vendor
      return order.line_items?.some(item => {
        const itemVendorId = item.meta_data?.find(m => m.key === '_vendor_id' || m.key === '_dokan_vendor_id')?.value;
        return String(itemVendorId) === String(wooId);
      });
    });

    return NextResponse.json({ orders: finalOrders });
  } catch (error) {
    console.error("Merchant orders fetch error:", error);
    return NextResponse.json({ error: error.message, orders: [] }, { status: 200 });
  }
}

import { NotificationService } from "@/lib/notifications";

export async function PUT(req) {
  try {
    const payload = await req.json();
    const { id, status, billing, shipping, meta_data } = payload;
    
    // Update order via WC API (Admin keys) for better status transition handling
    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (billing) updatePayload.billing = billing;
    if (shipping) updatePayload.shipping = shipping;
    if (meta_data) updatePayload.meta_data = meta_data;

    const wcRes = await wcApi.put(`orders/${id}`, updatePayload);
    const updatedOrder = wcRes.data;

    let notificationOrder = updatedOrder;
    try {
      const freshOrder = await wcApi.get(`orders/${id}`);
      if (freshOrder?.data) notificationOrder = freshOrder.data;
    } catch (err) {
      console.warn("Fresh order fetch for notification failed:", err.message);
    }

    // Notify Customer on Status Change
    if (status && notificationOrder) {
      const statusLabels = {
        'completed': '✅ Completed',
        'processing': '📦 Processing',
        'shipped': '🚚 Shipped',
        'cancelled': '❌ Cancelled',
        'refunded': '💰 Refunded',
        'on-hold': '⏳ On Hold'
      };

      const label = statusLabels[status] || status;
      const customerEmail = notificationOrder.billing?.email;
      const customerPhone = notificationOrder.billing?.phone;
      const customerId = notificationOrder.customer_id;

      const vendorMeta = notificationOrder.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id');
      const vendorId = vendorMeta?.value || '1';

      const itemsList = (notificationOrder.line_items || []).map(i => `• ${i.quantity}x ${i.name}`).join('\n');
      const currency = notificationOrder.currency || 'JOD';
      const subtotal = (parseFloat(notificationOrder.total || 0) - parseFloat(notificationOrder.shipping_total || 0)).toFixed(2);
      const shipping = parseFloat(notificationOrder.shipping_total || 0).toFixed(2);
      const total = parseFloat(notificationOrder.total || 0).toFixed(2);

      // Fetch store name and contact details
      let storeName = "Mahally";
      let storePhone = "";
      let storeEmail = "";

      try {
        const vendorRes = await wcApi.get(`customers/${vendorId}`);
        const vData = vendorRes.data;

        const storeNameMeta = vData?.meta_data?.find(m => m.key === 'mahally_store_name' || m.key === 'store_name' || m.key === 'dokan_store_name');
        if (storeNameMeta?.value) {
          storeName = storeNameMeta.value;
        } else if (vData?.first_name) {
          storeName = `${vData.first_name} ${vData.last_name || ''}`.trim();
        } else if (vData?.username) {
          storeName = vData.username;
        }

        const phoneMeta = vData?.meta_data?.find(m => m.key === 'mahally_whatsapp_number' || m.key === 'billing_phone');
        if (phoneMeta?.value) storePhone = phoneMeta.value;

        storeEmail = vData?.email || "";
      } catch (err) {}

      // Dynamically get Base URL
      const reqUrl = new URL(req.url);
      const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;

      let richMessage = `Your order #ORD-${id} is now ${label}. Thank you for shopping with ${storeName}!\n\n` +
        `🛒 *Order Summary:*\n${itemsList}\n\n` +
        `💳 *Product Total:* ${currency} ${subtotal}\n` +
        `🚚 *Shipping:* ${currency} ${shipping}\n` +
        `💵 *Total Amount:* ${currency} ${total}\n\n`;

      const reviewUrl = `${baseUrl}/account/orders`;
      const storeUrl = `${baseUrl}/store/${vendorId}`;
      const shopUrl = `${baseUrl}/browse?vendor=${vendorId}`;

      if (status === 'completed') {
        richMessage += `🌟 We hope you love your purchase!\n\n`;
      } else {
        richMessage += `We will keep you updated on any further changes!\n\n`;
      }

      richMessage += `► Review the product(s): ${reviewUrl}\n` +
                     `► Review our store: ${storeUrl}\n` +
                     `► Visit our store: ${storeUrl}\n` +
                     `► Keep shopping with us: ${shopUrl}\n`;
      
      if (storePhone) richMessage += `► Call / WhatsApp us: ${storePhone}\n`;
      if (storeEmail) richMessage += `► Email us: ${storeEmail}\n`;

      const channels = ['internal', 'email'];
      if (customerPhone && customerPhone.length > 5) {
        channels.push('whatsapp');
      }

      await NotificationService.notify({
        userId: customerId || `guest_${id}`,
        senderId: String(vendorId),
        title: `Order Update: ${label}`,
        message: richMessage,
        channel: channels,
        type: 'order_update',
        metadata: {
          orderId: id,
          email: customerEmail,
          phone: customerPhone,
          actionUrl: `${baseUrl}/account/orders/${id}`
        }
      }).catch(err => console.warn("Notification delay/fail:", err.message));
    }
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Order Update Error:", error.message);
    return NextResponse.json({ 
      error: error.message || "Failed to update order" 
    }, { status: 500 });
  }
}
