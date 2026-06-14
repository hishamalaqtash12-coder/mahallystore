const WP_URL = "http://mahally-test.local/wp-json/wc/v3/products?author=35";

async function main() {
  const headers = new Headers();
  headers.append("Authorization", "Basic " + Buffer.from("ck_24d6d634dbd1810bc7583689c8a93165b4c48970:cs_bb82e6ef296ec53f5080c10ebbf4f32af9cd0808").toString('base64'));

  try {
    const res = await fetch(WP_URL, { headers });
    const json = await res.json();
    console.log(json);
  } catch(e) { console.error(e) }
}
main();
