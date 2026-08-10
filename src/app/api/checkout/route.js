import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { generateMahallyId } from "@/lib/id-generator";
import { NotificationService } from "@/lib/notifications";
import { appendOrderToSheet } from "@/lib/google-sheets";

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customer, customerId, shippingFee = 0, locale = 'en' } = body;

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


    // --- GOOGLE SHEETS: Resolve merchant name then log order (non-blocking) ---
    const orderTotalForSheet = createdOrder.total
      ? parseFloat(createdOrder.total)
      : items.reduce((sum, i) => sum + (parseFloat(i.price || 0) * i.quantity), 0) + parseFloat(shippingFee || 0);

    // Try cart meta first; if missing, look up the product to get the store profile
    let merchantNameForSheet =
      items[0]?.meta_data?.find(m => m.key === "merchant_name")?.value ||
      items[0]?.store?.name ||
      items[0]?.storeName ||
      "";

    let vendorIdToUse = primaryVendorId;

    if (!merchantNameForSheet && items[0]?.id) {
      try {
        // The most reliable fallback: fetch the product itself
        const prodRes = await api.get(`products/${items[0].id}`);
        const prodData = prodRes.data;
        if (prodData) {
          merchantNameForSheet = 
            prodData.store?.name || 
            prodData.meta_data?.find(m => m.key === "merchant_name")?.value || 
            "";
          if (!vendorIdToUse) {
            vendorIdToUse = prodData.store?.id || prodData.author || "";
          }
        }
      } catch (e) {
        console.warn("[Sheets] Failed to fetch product for merchant name:", e.message);
      }
    }

    if (!merchantNameForSheet && vendorIdToUse) {
      try {
        const dokanStoreRes = await fetch(
          `${WP_URL}/wp-json/dokan/v1/stores/${vendorIdToUse}`,
          { headers: { Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}` } }
        );
        if (dokanStoreRes.ok) {
          const dokanStore = await dokanStoreRes.json();
          merchantNameForSheet =
            dokanStore?.store_name || dokanStore?.shop_name || dokanStore?.name || "";
        }
      } catch (_e) { /* non-fatal */ }
    }

    appendOrderToSheet({
      orderId: createdOrderId,
      mahallyId,
      items,
      customer,
      shippingFee: parseFloat(shippingFee || 0),
      orderTotal: orderTotalForSheet,
      merchantName: merchantNameForSheet,
      primaryVendorId,
    }).catch(err => console.warn("[Sheets] Non-fatal append error:", err.message));
    // ---------------------------------------------------------------


    if (customer?.email) {
      try {
        const orderTotal = createdOrder.total 
          ? parseFloat(createdOrder.total) 
          : items.reduce((sum, i) => sum + (parseFloat(i.price || 0) * i.quantity), 0) + parseFloat(shippingFee || 0);

        const orderDateStr = new Date().toLocaleString('en-JO', { timeZone: 'Asia/Amman', dateStyle: 'medium', timeStyle: 'short' });

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
              <p style="color: #be123c; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Order ID: <strong>#${createdOrderId}</strong></p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px;">
              <div>
                <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Date</p>
                <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${orderDateStr}</p>
              </div>
              <div>
                <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Mahally ID</p>
                <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${mahallyId}</p>
              </div>
              <div>
                <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Merchant / Store</p>
                <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${merchantNameForSheet || "Mahally Partner"}</p>
              </div>
              <div>
                <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Payment Method</p>
                <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">Cash on Delivery</p>
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
                <span>Shipping Fee (${customer.city || 'Amman'}):</span>
                <span>JOD ${parseFloat(shippingFee || 0).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: #18181b; font-size: 18px; font-weight: 900; margin-top: 8px;">
                <span>Total Amount:</span>
                <span style="color: #be374f;">JOD ${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #18181b; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">Delivery Information:</p>
              <p style="color: #52525b; font-size: 13px; margin: 0; line-height: 1.5;">
                <strong>${customer.firstName} ${customer.lastName}</strong><br />
                ${customer.address}, ${customer.city}<br />
                Phone: ${customer.phone}<br />
                Email: ${customer.email}
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

        console.log(`[Email Log] Dispatching CUSTOMER order confirmation...`);
        console.log(`   -> Recipient: ${customer.email} (User ID: ${customerId || customer.email})`);
        console.log(`   -> Sender ID (Vendor): ${primaryVendorId || "1"}`);
        
        await NotificationService.notify({
          userId: customerId || customer.email,
          senderId: String(primaryVendorId || "1"),
          title: locale === 'ar' ? `تأكيد الطلب #${createdOrderId} — محلي` : `Order Confirmation #${createdOrderId} — Mahally`,
          message: locale === 'ar' ? `تم إنشاء طلبك #${createdOrderId} بنجاح!` : `Your order #${createdOrderId} has been created successfully!`,
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

    // Fetch vendor email with robust multi-source lookup
    let vendorEmail = items[0]?.store?.email 
      || items[0]?.vendor_email 
      || items[0]?.vendorEmail 
      || items[0]?.meta_data?.find(m => m.key === "merchant_email")?.value 
      || items[0]?.meta_data?.find(m => m.key === "_vendor_email")?.value 
      || null;

    if (!vendorEmail && primaryVendorId) {
      // Source 1: Dokan REST API
      try {
        const dokanRes = await fetch(`${WP_URL}/wp-json/dokan/v1/stores/${primaryVendorId}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`
          }
        });
        if (dokanRes.ok) {
          const dokanData = await dokanRes.json();
          vendorEmail = dokanData?.email || dokanData?.payment?.paypal?.email || null;
        }
      } catch (dErr) {}

      // Source 2: WooCommerce Customers REST API
      if (!vendorEmail) {
        try {
          const vRes = await api.get(`customers/${primaryVendorId}`);
          vendorEmail = vRes.data?.email || vRes.data?.billing?.email || null;
        } catch (vErr) {}
      }

      // Source 3: WordPress Users REST API
      if (!vendorEmail) {
        try {
          const wpUserRes = await fetch(`${WP_URL}/wp-json/wp/v2/users/${primaryVendorId}`, {
            headers: {
              Authorization: `Basic ${Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64")}`
            }
          });
          if (wpUserRes.ok) {
            const wpUserData = await wpUserRes.json();
            vendorEmail = wpUserData?.user_email || wpUserData?.email || null;
          }
        } catch (wpErr) {}
      }
    }

    const orderTotalCalculated = createdOrder.total 
      ? parseFloat(createdOrder.total) 
      : items.reduce((sum, i) => sum + (parseFloat(i.price || 0) * i.quantity), 0) + parseFloat(shippingFee || 0);

    const vendorItemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #f4f4f5;">
        <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 600;">${item.name || item.title}</td>
        <td style="padding: 10px 0; color: #71717a; font-size: 14px; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px 0; color: #18181b; font-size: 14px; font-weight: 700; text-align: right;">JOD ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join("");

    const adminEmailTarget = "info@mahallystore.com";
    const hasDistinctVendorEmail = vendorEmail && vendorEmail.toLowerCase() !== adminEmailTarget.toLowerCase() && vendorEmail.toLowerCase() !== (customer?.email || "").toLowerCase();

    // --- EMAIL 2: VENDOR NOTIFICATION ---
    try {
      const orderDateStr = new Date().toLocaleString('en-JO', { timeZone: 'Asia/Amman', dateStyle: 'medium', timeStyle: 'short' });

      const vendorOrderHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #be374f; font-size: 28px; font-weight: 900; margin: 0;">Mahally</h1>
            <p style="color: #059669; font-size: 13px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">New Merchant Order Alert</p>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="color: #065f46; font-size: 16px; font-weight: 800; margin: 0;">🛍️ You received a new order! #${createdOrderId}</p>
            <p style="color: #047857; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Customer: <strong>${customer.firstName} ${customer.lastName}</strong></p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px;">
            <div>
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Date</p>
              <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${orderDateStr}</p>
            </div>
            <div>
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Mahally ID</p>
              <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${mahallyId}</p>
            </div>
            <div>
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Store Name</p>
              <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">${merchantNameForSheet || "Mahally Partner"}</p>
            </div>
            <div>
              <p style="color: #71717a; font-size: 11px; text-transform: uppercase; margin: 0 0 4px 0; font-weight: 700;">Payment Method</p>
              <p style="color: #18181b; font-size: 13px; margin: 0; font-weight: 600;">Cash on Delivery (COD)</p>
            </div>
          </div>

          <h3 style="color: #18181b; font-size: 14px; font-weight: 700; margin-bottom: 12px; border-bottom: 2px solid #18181b; padding-bottom: 8px;">Ordered Items</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #e4e4e7; text-align: left; color: #a1a1aa; font-size: 11px; text-transform: uppercase;">
                <th style="padding-bottom: 8px;">Item</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${vendorItemsHtml}
            </tbody>
          </table>

          <div style="border-top: 2px dashed #e4e4e7; padding-top: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; color: #71717a; font-size: 13px; margin-bottom: 6px;">
              <span>Shipping Fee (${customer.city || 'Amman'}):</span>
              <span>JOD ${parseFloat(shippingFee || 0).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #18181b; font-size: 18px; font-weight: 900; margin-top: 8px;">
              <span>Total Amount:</span>
              <span style="color: #be374f;">JOD ${orderTotalCalculated.toFixed(2)}</span>
            </div>
          </div>

          <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #18181b; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">Customer Shipping Info:</p>
            <p style="color: #52525b; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong>${customer.firstName} ${customer.lastName}</strong><br />
              ${customer.address}, ${customer.city}<br />
              Phone: ${customer.phone}<br />
              Email: ${customer.email}
            </p>
          </div>

          <div style="text-align: center;">
            <a href="https://mahallystore.com/merchant/dashboard/orders" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
              Manage Order in Merchant Dashboard &rarr;
            </a>
          </div>
        </div>
      `;

      console.log(`[Email Log] Dispatching VENDOR new order alert...`);
      console.log(`   -> Recipient: ${vendorEmail || adminEmailTarget}`);
      console.log(`   -> Included Channels: ${(vendorEmail ? ['internal', 'email'] : ['internal']).join(', ')}`);
      
      await NotificationService.notify({
        userId: String(primaryVendorId || "1"),
        senderId: "1",
        title: `🛍️ New Order Received #${createdOrderId} — Mahally`,
        message: `You received a new order #${createdOrderId} from ${customer.firstName} ${customer.lastName}!`,
        channel: vendorEmail ? ['internal', 'email'] : ['internal'],
        type: 'new_order_merchant',
        metadata: {
          email: vendorEmail || adminEmailTarget,
          orderId: createdOrderId,
          actionUrl: "https://mahallystore.com/merchant/dashboard/orders",
          html: vendorOrderHtml
        }
      }).catch(err => console.warn("Vendor notification warning:", err.message));
    } catch (vErr) {
      console.warn("Failed to dispatch vendor order email:", vErr.message);
    }

    // --- EMAIL 3: ADMINISTRATOR NOTIFICATION (info@mahallystore.com) ---
    try {
      const adminOrderHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 16px; padding: 32px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #be374f; font-size: 28px; font-weight: 900; margin: 0;">Mahally Admin</h1>
            <p style="color: #71717a; font-size: 12px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Platform Order Alert</p>
          </div>

          <div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="color: #18181b; font-size: 16px; font-weight: 800; margin: 0;">🔔 New Order Placed: #${createdOrderId}</p>
            <p style="color: #71717a; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Total: <strong>JOD ${orderTotalCalculated.toFixed(2)}</strong> (COD)</p>
          </div>

          <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #18181b; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">Summary Details:</p>
            <p style="color: #52525b; font-size: 13px; margin: 0; line-height: 1.5;">
              Customer: ${customer.firstName} ${customer.lastName} (${customer.email})<br />
              City: ${customer.city}<br />
              Merchant ID: ${primaryVendorId || 'N/A'}<br />
              Vendor Email: ${vendorEmail || 'Not Specified'}
            </p>
          </div>

          <div style="text-align: center;">
            <a href="https://mahallystore.com/admin/orders" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px;">
              View Admin Orders &rarr;
            </a>
          </div>
        </div>
      `;

      console.log(`[Email Log] Dispatching ADMIN order alert...`);
      console.log(`   -> Recipient: ${adminEmailTarget}`);
      
      await NotificationService.notify({
        userId: "1",
        senderId: "1",
        title: `🔔 New Order Placed #${createdOrderId} — Mahally Admin`,
        message: `New order #${createdOrderId} placed by ${customer.firstName} ${customer.lastName} (Total: JOD ${orderTotalCalculated.toFixed(2)})`,
        channel: ['email'],
        type: 'new_order_admin',
        metadata: {
          email: adminEmailTarget,
          orderId: createdOrderId,
          actionUrl: "https://mahallystore.com/admin/orders",
          html: adminOrderHtml
        }
      }).catch(err => console.warn("Admin notification warning:", err.message));
    } catch (aErr) {
      console.warn("Failed to dispatch admin order email:", aErr.message);
    }
    
    return NextResponse.json({ success: true, orderId: createdOrderId });

  } catch (error) {
    console.error("Checkout API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to create order in WooCommerce', details: error.response?.data || error.message }, { status: 500 });
  }
}
