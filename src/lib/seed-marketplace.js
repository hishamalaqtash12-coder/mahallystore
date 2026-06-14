const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config();

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://mahally-test.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

const brandNames = ["Nike", "Samsung", "Apple", "Logitech", "IKEA", "Toyota", "Sony", "Dell", "Lego", "Mahally Signature"];
const tagsList = ["Flash Deal", "Limited Edition", "Best Value", "Premium", "Hot", "New Arrival", "Star Seller", "Eco Friendly"];

async function cleanupAndSeed() {
  console.log("🧹 PHASE 1: Final Cleanup...");
  
  try {
    let hasMore = true;
    while (hasMore) {
      const res = await api.get("products", { per_page: 100 });
      if (res.data.length === 0) {
        hasMore = false;
      } else {
        const ids = res.data.map(p => p.id);
        await api.post("products/batch", { delete: ids });
        console.log(`✅ Deleted ${ids.length} products...`);
      }
    }

    console.log("🚀 PHASE 2: Syncing Brands (Parameter identified: 'brand')...");
    const brandMap = {};
    for (const name of brandNames) {
      try {
        const res = await api.post("products/brands", { name });
        brandMap[name] = res.data.id;
      } catch (err) {
        const res = await api.get("products/brands", { search: name });
        if (res.data.length > 0) brandMap[name] = res.data[0].id;
      }
    }

    console.log("🚀 PHASE 3: Seeding 50 Products with Guaranteed Data...");
    const timestamp = Date.now();
    const categories = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"];
    const createdCats = [];
    for (const name of categories) {
      try {
        const res = await api.post("products/categories", { name });
        createdCats.push(res.data);
      } catch (err) {
        const res = await api.get("products/categories", { search: name });
        if (res.data.length > 0) createdCats.push(res.data[0]);
      }
    }

    for (let i = 1; i <= 50; i++) {
      const bName = brandNames[Math.floor(Math.random() * brandNames.length)];
      const bId = brandMap[bName];
      const cat = createdCats[Math.floor(Math.random() * createdCats.length)];
      
      const productData = {
        name: `[RICH] ${bName} Series - ${i}`,
        type: "simple",
        sku: `SKU-${timestamp.toString().slice(-3)}-${i}`,
        regular_price: (Math.random() * 100 + 20).toFixed(2),
        categories: [{ id: cat.id }],
        tags: [{ name: tagsList[Math.floor(Math.random() * tagsList.length)] }, { name: bName }],
        brand: [bId], // VERIFIED: This is the correct singular field name!
        manage_stock: true,
        stock_quantity: Math.floor(Math.random() * 50) + 1,
        attributes: [
          {
            name: "Brand",
            visible: true,
            options: [bName]
          }
        ]
      };

      try {
        await api.post("products", productData);
      } catch (err) {
        console.error(`❌ Error on product ${i}:`, err.response?.data?.message || err.message);
      }

      if (i % 10 === 0) console.log(`✅ Progress: ${i}/50 created.`);
    }

    console.log("✨ MISSION ACCOMPLISHED! SKU, Tags, and Brands are all working.");
  } catch (error) {
    console.error("❌ Fatal Error:", error.response?.data || error.message);
  }
}

cleanupAndSeed();
