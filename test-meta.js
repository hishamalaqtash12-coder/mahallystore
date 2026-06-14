const fs = require('fs');
require('dotenv').config({ path: '.env' });

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");

async function test() {
  const res = await fetch(`${WP_URL}/wp-json/wc/v3/customers?role=all&per_page=10`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  const data = await res.json();
  console.log("Returned users:", data.length);
  if (data.length > 0) {
    const roles = data.map(u => u.role);
    console.log("Roles found:", new Set(roles));
  }
}

test();
