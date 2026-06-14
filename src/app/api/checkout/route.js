import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { generateMahallyId } from "@/lib/id-generator";

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
      // Start as 'on-hold' so stock is NOT reduced at creation.
      // WooCommerce only reduces stock when order moves to 'processing'.
      // Stock will be reduced when the merchant accepts and processes the order.
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
    
    return NextResponse.json({ success: true, orderId: response.data.id });

  } catch (error) {
    console.error("Checkout API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to create order in WooCommerce', details: error.response?.data || error.message }, { status: 500 });
  }
}
