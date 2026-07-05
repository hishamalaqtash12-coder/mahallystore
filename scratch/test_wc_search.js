import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi.default({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3",
});

async function test() {
  try {
    const phone = "0790910041"; 
    const res = await api.get("customers", { search: phone, role: "all" });
    console.log("Search by phone:", res.data.length, "found");
    console.log(res.data.map(c => c.billing?.phone));
  } catch (e) {
    console.error(e);
  }
}

test();
