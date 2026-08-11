import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export async function POST(request) {
  try {
    const { orderId, email } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const api = new WooCommerceRestApi({
      url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
      consumerKey: process.env.WC_CONSUMER_KEY,
      consumerSecret: process.env.WC_CONSUMER_SECRET,
      version: "wc/v3"
    });

    // 1. Fetch the order first to verify status and ownership
    const orderRes = await api.get(`orders/${orderId}`);
    const order = orderRes.data;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security check: Verify email matches
    if (order.billing.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business Logic: Can only cancel if not shipped or completed
    const nonCancellable = ['shipped', 'completed', 'cancelled', 'refunded'];
    if (nonCancellable.includes(order.status)) {
      return NextResponse.json({ 
        error: `Order cannot be cancelled because it is already ${order.status}.` 
      }, { status: 400 });
    }

    // 2. Update order status to cancelled
    await api.put(`orders/${orderId}`, {
      status: 'cancelled',
      meta_data: [
        {
          key: '_cancelled_by_role',
          value: 'customer'
        }
      ]
    });

    // 3. Add order note
    await api.post(`orders/${orderId}/notes`, {
      note: "Order cancelled by customer via Mahally Account Dashboard.",
      customer_note: true
    });

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error("Cancel Order error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
