
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "http://mahally-test.local",
  consumerKey: "ck_c90af893b7bc6bba95a92508bc85f770ad08df55",
  consumerSecret: "cs_8c4c75130ceaa4eb70021e5ac75f1f6e374cc1fa",
  version: "wc/v3"
});

async function check() {
  try {
    const res = await api.get("products", { per_page: 50 });
    console.log("Total Products found:", res.data.length);
    res.data.forEach(p => {
      const owner = p.meta_data?.find(m => m.key === "mahally_owner")?.value;
      const mEmail = p.meta_data?.find(m => m.key === "merchant_email")?.value;
      console.log(`ID: ${p.id}, Name: ${p.name}, Owner: ${owner}, MerchantEmail: ${mEmail}`);
    });
  } catch (e) {
    console.error(e.message);
  }
}

check();
