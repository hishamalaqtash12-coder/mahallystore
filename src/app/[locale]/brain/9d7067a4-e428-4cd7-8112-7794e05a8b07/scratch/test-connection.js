const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://mahally-test.local",
  consumerKey: "ck_c90af893b7bc6bba95a92508bc85f770ad08df55",
  consumerSecret: "cs_8c4c75130ceaa4eb70021e5ac75f1f6e374cc1fa",
  version: "wc/v3"
});

async function testConnection() {
  console.log("🔍 Testing GET /products connection...");
  try {
    const response = await api.get("products", { per_page: 1 });
    console.log(`✅ Success! Found ${response.headers['x-wp-total']} products.`);
    console.log("Next, verifying POST capability...");
  } catch (error) {
    console.error("❌ GET Failed:");
    console.error(error.response?.data?.message || error.message);
  }
}

testConnection();
