const dotenv = require("dotenv");
dotenv.config();

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const wcAuth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");

async function listAdmins() {
  const res = await fetch(`${WP_URL}/wp-json/wc/v3/customers?role=administrator&per_page=20`, {
    headers: { Authorization: `Basic ${wcAuth}` }
  });
  const admins = await res.json();
  console.log(`Total administrators found: ${admins.length}\n`);
  admins.forEach((a, i) => {
    console.log(`${i + 1}. ID: ${a.id}, Email: ${a.email}, Username: ${a.username}`);
  });
  console.log(`\n⚠ getAdminId() currently picks the FIRST one: ID ${admins[0]?.id} (${admins[0]?.email})`);
  console.log(`   All messages to "admin/support" are routed ONLY to this account.`);
}

listAdmins().catch(console.error);
