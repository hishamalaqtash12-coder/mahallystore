const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://mahally-test.local",
  consumerKey: "ck_c90af893b7bc6bba95a92508bc85f770ad08df55",
  consumerSecret: "cs_8c4c75130ceaa4eb70021e5ac75f1f6e374cc1fa",
  version: "wc/v3"
});

async function fix() {
  try {
    const productsRes = await api.get("products", { author: 35, per_page: 100 });
    const vendorProducts = productsRes.data;
    
    if (vendorProducts.length > 0) {
      const batchPayload = {
        update: vendorProducts.map(p => ({
          id: p.id,
          meta_data: [
            { key: "mahally_owner_name", value: "منتج تجريبي" }, // Assuming that was the new name they wanted? Or maybe they changed it to something else.
            { key: "merchant_name",      value: "منتج تجريبي" }
          ]
        }))
      };
      
      const res = await api.post("products/batch", batchPayload);
      console.log("Success! Updated", res.data.update.length, "products.");
    } else {
        console.log("No products found");
    }
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}

fix();
