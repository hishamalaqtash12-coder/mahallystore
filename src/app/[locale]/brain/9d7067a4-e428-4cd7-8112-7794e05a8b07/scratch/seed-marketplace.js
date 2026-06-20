const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://mahally-test.local",
  consumerKey: "ck_c90af893b7bc6bba95a92508bc85f770ad08df55",
  consumerSecret: "cs_8c4c75130ceaa4eb70021e5ac75f1f6e374cc1fa",
  version: "wc/v3"
});

const products = [
  {
    name: "Embroidered Thobe - Amman Style",
    type: "simple",
    regular_price: "85.00",
    description: "Elegant traditional Jordanian Thobe with intricate hand-embroidery. Perfect for special occasions.",
    short_description: "Traditional Jordanian hand-embroidered thobe.",
    categories: [{ name: "Fashion" }]
  },
  {
    name: "Organic Medjool Dates 1kg",
    type: "simple",
    regular_price: "12.50",
    sale_price: "10.00",
    description: "Premium large Medjool dates grown in the Jordan Valley. 100% organic and naturally sweet.",
    short_description: "Premium Jordan Valley Medjool dates.",
    categories: [{ name: "Food & Grocery" }]
  },
  {
    name: "Hand-Woven Bedouin Rug",
    type: "simple",
    regular_price: "120.00",
    description: "Authentic wool rug hand-woven by Bedouin women in Wadi Rum. Features traditional patterns and natural dyes.",
    short_description: "Authentic Wadi Rum hand-woven rug.",
    categories: [{ name: "Home & Living" }]
  },
  {
    name: "Silver Filigree Earrings",
    type: "simple",
    regular_price: "45.00",
    description: "Fine silver earrings featuring traditional Jordanian filigree work. Handmade in Downtown Amman.",
    short_description: "Handmade silver filigree earrings.",
    categories: [{ name: "Handmade" }]
  }
];

async function seedMarketplace() {
  console.log("🌱 Seeding Mahally Marketplace with Jordanian goods...");
  for (const product of products) {
    try {
      const response = await api.post("products", product);
      console.log(`✅ Seeded: ${response.data.name} (ID: ${response.data.id})`);
    } catch (error) {
      console.error(`❌ Failed: ${product.name}`);
      console.error(error.response?.data?.message || error.message);
    }
  }
  console.log("✨ Seeding complete. The marketplace is now alive!");
}

seedMarketplace();
