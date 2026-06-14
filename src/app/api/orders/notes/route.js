import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const response = await api.get(`orders/${orderId}/notes`);
    
    // Show all notes except purely technical/system background notes (like stock reduction)
    const visibleNotes = response.data.filter(note => 
      !note.note.toLowerCase().includes("stock levels reduced") &&
      !note.note.toLowerCase().includes("added a note") // avoid meta-notes
    );
    
    return NextResponse.json(visibleNotes);
  } catch (error) {
    console.error("Order notes API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
