import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function POST(request) {
  try {
    const { orderId, note } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch the order first to check for existing meta IDs
    const orderRes = await api.get(`orders/${orderId}`);
    const existingOrder = orderRes.data;

    const existingConfirm = existingOrder.meta_data?.find(m => m.key === 'mahally_customer_confirmed_receipt');
    const existingConfirmDate = existingOrder.meta_data?.find(m => m.key === 'mahally_confirmation_date');

    const metaUpdate = [
      {
        key: 'mahally_customer_confirmed_receipt',
        value: 'yes'
      },
      {
        key: 'mahally_confirmation_date',
        value: new Date().toISOString()
      }
    ];

    if (existingConfirm) {
      metaUpdate[0].id = existingConfirm.id;
    }
    if (existingConfirmDate) {
      metaUpdate[1].id = existingConfirmDate.id;
    }

    const response = await api.put(`orders/${orderId}`, {
      meta_data: metaUpdate
    });

    // 2. Add a note to the order history
    await api.post(`orders/${orderId}/notes`, {
      note: `Customer confirmed receipt of the product. ${note ? `Customer Note: ${note}` : ''}`,
      customer_note: false // Internal note for merchant to see
    });

    return NextResponse.json({ success: true, order: response.data });
  } catch (error) {
    console.error("Confirm receipt API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to confirm receipt' }, { status: 500 });
  }
}
