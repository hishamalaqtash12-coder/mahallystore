import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { generateMahallyId } from "@/lib/id-generator";
import { NotificationService } from "@/lib/notifications";

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, customerId, shippingFee = 0 } = body;

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const WC_KEY = process.env.WC_CONSUMER_KEY;
    const WC_SECRET = process.env.WC_CONSUMER_SECRET;

    if (!WP_URL || !WC_KEY || !WC_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const api = new WooCommerceRestApi({
      url: WP_URL,
      consumerKey: WC_KEY,
      consumerSecret: WC_SECRET,
      version: "wc/v3"
    });

    // Format line items for WooCommerce API
    const line_items = items.map(item => {
      // Extract vendor ID from meta_data or author
      const vendorId = item.meta_data?.find(m => m.key === "_vendor_id")?.value || item.vendorId || item.author;
      const merchantName = item.meta_data?.find(m => m.key === "merchant_name")?.value || "Mahally Partner";
      const merchantPhone = item.meta_data?.find(m => m.key === "merchant_phone")?.value || "";

      return {
        product_id: item.id,
        variation_id: item.variation_id || 0,
        quantity: item.quantity,
        meta_data: [
          { key: "merchant_name", value: merchantName },
          { key: "merchant_id", value: vendorId ? String(vendorId) : "" },
          { key: "merchant_phone", value: merchantPhone },
          { key: "_dokan_vendor_id", value: vendorId }, // CRITICAL for Dokan
          { key: "dokan_vendor_id", value: vendorId }
        ]
      };
    });

    const vendorSlug = items[0]?.vendor_slug || "";
    const mahallyId = generateMahallyId('order', vendorSlug);
    const primaryVendorId = items[0]?.meta_data?.find(m => m.key === "_vendor_id")?.value || items[0]?.author;

    const orderData = {
      customer_id: customerId ? parseInt(customerId) : 0,
      payment_method: "cod",
      payment_method_title: "Cash on Delivery",
      status: "on-hold",
      set_paid: false,
      meta_data: [
        { key: "mahally_id", value: mahallyId },
        { key: "_dokan_vendor_id", value: primaryVendorId },
        { key: "dokan_vendor_id", value: primaryVendorId },
        { key: "mahally_governorate", value: customer.city }
      ],
      billing: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        address_1: customer.address,
        city: customer.city,
        country: customer.country,
        email: customer.email,
        phone: customer.phone
      },
      shipping: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        address_1: customer.address,
        city: customer.city,
        country: customer.country,
      },
      line_items: line_items,
      shipping_lines: [
        {
          method_id: "flat_rate",
          method_title: "Mahally Delivery",
          total: String(shippingFee)
        }
      ]
    };

    // Add Order Attribution (Origin: Mahally)
    orderData.meta_data = [
      ...(orderData.meta_data || []),
      { key: "_wc_order_attribution_source_type", value: "web" },
      { key: "_wc_order_attribution_origin", value: "Mahally App" },
      { key: "_wc_order_attribution_device_type", value: "Desktop" },
      { key: "mahally_origin", value: "Mahally.jo Dashboard" }
    ];

    const response = await api.post("orders", orderData);
    const createdOrder = response.data;
    const createdOrderId = createdOrder.id;

    // Dispatch Order Confirmation Email to Customer
    if (customer?.email) {
      try {
        const orderTotal = createdOrder.total 
          ? parseFloat(createdOrder.total) 
          : items.reduce((sum, i) => sum + (parseFloat(i.price || 0) * i.quantity), 0) + parseFloat(shippingFee || 0);

        const itemsHtml = items.map(item => `
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 600;">${item.name || item.title}</td>
            <td style="padding: 10px 0; color: #71717a; font-size: 14px; text-align: center;">x${item.quantity}</td>
            <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">JOD ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
          </tr>
        `).join("");

        const orderConfirmationHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #be374f; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">Mahally</h1>
              <p style="color: #71717a; font-size: 12px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Order Confirmation</p>
            </div>

            <div style="background: #fdf2f4; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <p style="color: #9f1239; font-size: 15px; font-weight: 700; margin: 0;">🎉 Thank you for your order, ${customer.firstName || 'Customer'}!</p>
              <p style="color: #be123c; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Order ID: <strong>#${createdOrderId}</strong> (${mahallyId})</p>
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
                <span>Shipping Fee (${customer.city || 'Amman'}):</span>
                <span>JOD ${parseFloat(shippingFee || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #18181b; font-size: 18px; font-weight: 900; margin-top: 8px;">
                <span>Total Amount (COD):</span>
                <span style="color: #be374f;">JOD ${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #18181b; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">Delivery Address:</p>
              <p style="color: #52525b; font-size: 13px; margin: 0; line-height: 1.5;">
                ${customer.firstName} ${customer.lastName}<br />
                ${customer.address}, ${customer.city}<br />
                Phone: ${customer.phone}
              </p>
            </div>

            <div style="text-align: center;">
              <a href="https://mahallystore.com/account/orders" style="display: inline-block; background: #be374f; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
                View Order Status &rarr;
              </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #f4f4f5; margin: 28px 0 16px 0;" />
            <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 0;">This is an automated order confirmation from Mahally Marketplace.</p>
          </div>
        `;

        await NotificationService.notify({
          userId: customerId || customer.email,
          senderId: String(primaryVendorId || "1"),
          title: `Order Confirmation #${createdOrderId} — Mahally`,
          message: `Your order #${createdOrderId} has been created successfully!`,
          channel: ['internal', 'email'],
          type: 'order_confirmation',
          metadata: {
            email: customer.email,
            orderId: createdOrderId,
            actionUrl: "https://mahallystore.com/account/orders",
            html: orderConfirmationHtml
          }
        }).catch(err => console.warn("Order confirmation notification warning:", err.message));
      } catch (notifyErr) {
        console.warn("Failed to dispatch order confirmation email:", notifyErr.message);
      }
    }
    
    return NextResponse.json({ success: true, orderId: createdOrderId });

  } catch (error) {
    console.error("Checkout API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to create order in WooCommerce', details: error.response?.data || error.message }, { status: 500 });
  }
}
