import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function PUT(request) {
  try {
    const { orderId, email, shipping } = await request.json();

    if (!orderId || !email || !shipping) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the order to verify ownership and status
    const orderRes = await api.get(`orders/${orderId}`);
    const order = orderRes.data;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership (email match)
    if (order.billing?.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized to edit this order' }, { status: 403 });
    }

    // Only allow editing if order is still processing, pending, or on-hold
    const allowedStatuses = ['processing', 'pending', 'on-hold'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json({ error: 'Cannot edit address for orders that are already shipped or completed' }, { status: 400 });
    }

    // Update the shipping address and optionally the phone number in billing
    const updatePayload = {
      shipping: {
        first_name: shipping.first_name || order.shipping.first_name,
        last_name: shipping.last_name || order.shipping.last_name,
        address_1: shipping.address_1 || order.shipping.address_1,
        city: shipping.city || order.shipping.city,
        country: shipping.country || order.shipping.country,
      }
    };

    if (shipping.phone) {
      updatePayload.billing = {
        ...order.billing,
        phone: shipping.phone
      };
    }

    const updatedOrderRes = await api.put(`orders/${orderId}`, updatePayload);
    
    // Optional: Add an order note to log the address change
    await api.post(`orders/${orderId}/notes`, {
      note: `Customer updated shipping address to: ${updatePayload.shipping.address_1}, ${updatePayload.shipping.city}. Phone: ${shipping.phone || 'unchanged'}`,
      customer_note: false
    });

    return NextResponse.json(updatedOrderRes.data);
  } catch (error) {
    console.error("Update address error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to update order address' }, { status: 500 });
  }
}
