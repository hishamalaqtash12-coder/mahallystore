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

    let oldStatus = 'unknown';
    try {
      const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
      const wcAuth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
      const oldOrderRes = await fetch(`${WP_URL}/wp-json/wc/v3/orders/${id}`, {
        headers: { Authorization: `Basic ${wcAuth}` }
      });
      const oldOrderData = await oldOrderRes.json();
      if (oldOrderData?.status) oldStatus = oldOrderData.status.toLowerCase();
    } catch(e){}

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

      let richMessage = `Your order #ORD-${id} has changed from ${statusLabels[oldStatus] || oldStatus} to ${label}. Thank you for shopping with ${storeName}!\n\n` +
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

      const orderDateStr = new Date().toLocaleString('en-JO', { timeZone: 'Asia/Amman', dateStyle: 'medium', timeStyle: 'short' });
      const itemsHtml = (notificationOrder.line_items || []).map(item => `
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 600;">${item.name}</td>
          <td style="padding: 10px 0; color: #71717a; font-size: 14px; text-align: center;">x${item.quantity}</td>
          <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">${currency} ${parseFloat(item.total || 0).toFixed(2)}</td>
        </tr>
      `).join("");

      const htmlMessage = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #be374f; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">Mahally</h1>
            <p style="color: #71717a; font-size: 12px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Order Update</p>
          </div>

          <div style="background: #fdf2f4; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="color: #9f1239; font-size: 15px; font-weight: 700; margin: 0;">📦 Your order has changed from <strong>${statusLabels[oldStatus] || oldStatus}</strong> to <strong>${label}</strong>!</p>
            <p style="color: #be123c; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Order ID: <strong>#${id}</strong></p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px;">
            <div>
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Date Updated</p>
              <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${orderDateStr}</p>
            </div>
            <div>
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Merchant / Store</p>
              <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${storeName}</p>
            </div>
          </div>

          <h3 style="color: #18181b; font-size: 14px; font-weight: 700; margin-bottom: 12px; border-bottom: 2px solid #18181b; padding-bottom: 8px;">Order Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #e4e4e7; text-align: left; color: #a1a1aa; font-size: 11px; text-transform: uppercase;">
                <th style="padding-bottom: 8px;">Item</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px dashed #e4e4e7; padding-top: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; color: #71717a; font-size: 13px; margin-bottom: 6px;">
              <span>Shipping Fee:</span>
              <span>${currency} ${shipping}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #18181b; font-size: 18px; font-weight: 900; margin-top: 8px;">
              <span>Total Amount:</span>
              <span style="color: #be374f;">${currency} ${total}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${reviewUrl}" style="display: inline-block; background: #be374f; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
              View Order Details &rarr;
            </a>
          </div>
        </div>
      `;

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
          actionUrl: reviewUrl,
          html: htmlMessage
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
