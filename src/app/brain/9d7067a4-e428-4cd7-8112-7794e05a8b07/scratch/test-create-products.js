const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

// Load env vars (simulated for node script)
const api = new WooCommerceRestApi({
  url: "http://mahally-test.local",
  consumerKey: "ck_c90af893b7bc6bba95a92508bc85f770ad08df55",
  consumerSecret: "cs_8c4c75130ceaa4eb70021e5ac75f1f6e374cc1fa",
  version: "wc/v3"
});

const products = [
  {
    name: "Handmade Olive Wood Bowl",
    type: "simple",
    regular_price: "25.00",
    description: "Beautifully crafted olive wood bowl from local artisans in Jerash, Jordan.",
    categories: [{ id: 16 }] // Assuming 16 is 'Handmade'
  },
  {
    name: "Pure Dead Sea Mud Mask",
    type: "simple",
    regular_price: "15.00",
    description: "Authentic Dead Sea mud for natural skin rejuvenation.",
    categories: [{ id: 17 }] // Assuming 17 is 'Beauty'
  }
];

async function createTestProducts() {
  console.log("🚀 Starting bulk product creation test...");
  for (const product of products) {
    try {
      const response = await api.post("products", product);
      console.log(`✅ Created: ${response.data.name} (ID: ${response.data.id})`);
    } catch (error) {
      console.error(`❌ Failed: ${product.name}`);
      console.error(error.response?.data?.message || error.message);
    }
  }
  console.log("🏁 Test complete.");
}

createTestProducts();
