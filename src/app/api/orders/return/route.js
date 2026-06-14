import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export async function POST(request) {
  try {
    const { orderId, email, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const api = new WooCommerceRestApi({
      url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
      consumerKey: process.env.WC_CONSUMER_KEY,
      consumerSecret: process.env.WC_CONSUMER_SECRET,
      version: "wc/v3"
    });

    // 1. Fetch the order first
    const orderRes = await api.get(`orders/${orderId}`);
    const order = orderRes.data;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security check
    if (order.billing.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business Logic: Can only return if completed
    if (order.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Only completed orders can be returned.' 
      }, { status: 400 });
    }

    // 2. Mark as return requested via meta_data and add note
    await api.put(`orders/${orderId}`, {
      meta_data: [
        ...(order.meta_data || []),
        { key: 'mahally_return_requested', value: 'yes' },
        { key: 'mahally_return_reason', value: reason || "No reason provided" }
      ]
    });

    await api.post(`orders/${orderId}/notes`, {
      note: `Customer requested a return. Reason: ${reason || "No reason provided"}`,
      customer_note: true
    });

    return NextResponse.json({ success: true, message: 'Return request submitted successfully' });
  } catch (error) {
    console.error("Return Order error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to submit return request' }, { status: 500 });
  }
}
