import { NextResponse } from "next/server";
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function GET() {
  try {
    const res = await api.get("products/attributes");
    const attributes = res.data;

    // For each attribute, fetch its terms
    const attributesWithTerms = await Promise.all(attributes.map(async (attr) => {
      const termsRes = await api.get(`products/attributes/${attr.id}/terms`);
      return { ...attr, terms: termsRes.data };
    }));

    return NextResponse.json(attributesWithTerms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    const { attributeId, termName } = await req.json();
    const res = await api.post(`products/attributes/${attributeId}/terms`, { name: termName });
    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Create term error:", error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || "Failed to create attribute term" 
    }, { status: 500 });
  }
}
