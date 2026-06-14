import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const user = process.env.WP_ADMIN_USER;
const pass = process.env.WP_ADMIN_APP_PASS;
const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

async function run() {
  const res = await fetch(`${url}/wp-json/wc/v3/products/879`, {
    headers: { Authorization: authHeader }
  });
  const p = await res.json();
  console.log("Product ID 879 details:");
  console.log("Author:", p.author);
  console.log("Post Author:", p.post_author);
  console.log("Store:", p.store);
  console.log("Dokan Store Name:", p.store?.shop_name || p.store?.name || "Not present");
}
run();
