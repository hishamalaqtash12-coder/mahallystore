import { NextResponse } from "next/server";
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

// GET /api/merchant/orders/notes?id=123
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error("Order ID required");

    const res = await api.get(`orders/${id}/notes`);
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/merchant/orders/notes
export async function POST(request) {
  try {
    const { id, note, customer_note } = await request.json();
    const res = await api.post(`orders/${id}/notes`, {
      note,
      customer_note: customer_note || false
    });
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/merchant/orders/notes
export async function DELETE(request) {
  try {
    const { orderId, noteId } = await request.json();
    const res = await api.delete(`orders/${orderId}/notes/${noteId}`, { force: true });
    return NextResponse.json(res.data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
