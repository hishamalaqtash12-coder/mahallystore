
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://mahally-test.local",
  consumerKey: "ck_c90af893b7bc6bba95a92508bc85f770ad08df55",
  consumerSecret: "cs_8c4c75130ceaa4eb70021e5ac75f1f6e374cc1fa",
  version: "wc/v3"
});

async function check() {
  try {
    const res = await api.get("products/674");
    console.log("Product 674 Metadata:");
    console.log(JSON.stringify(res.data.meta_data, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}

check();
