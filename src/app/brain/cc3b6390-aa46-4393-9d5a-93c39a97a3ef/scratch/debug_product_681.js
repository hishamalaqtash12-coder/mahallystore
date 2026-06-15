const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const dotenv = require("dotenv");
dotenv.config();

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

async function checkProduct(id) {
  try {
    const res = await api.get(`products/${id}`);
    console.log("Product Data:", JSON.stringify(res.data, null, 2));
    
    if (res.data.type === "variable") {
      const variations = await api.get(`products/${id}/variations`);
      console.log("Variations:", JSON.stringify(variations.data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

checkProduct(681);
