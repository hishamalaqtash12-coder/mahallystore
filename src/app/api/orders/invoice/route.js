import { NextResponse } from 'next/server';
import { generateInvoicePdf } from '@/lib/pdf-generator';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const email = searchParams.get('email'); // Optional, used for some light security check

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Fetch the order
    const orderRes = await api.get(`orders/${orderId}`);
    const order = orderRes.data;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if email is provided and matches (simple security so arbitrary users can't download others' invoices if they guess the ID)
    if (email && order.billing?.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized to access this invoice' }, { status: 403 });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf(order);

    // Return as PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice_${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
