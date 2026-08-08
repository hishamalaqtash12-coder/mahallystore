/**
 * One-time script: promote account by phone to seller/vendor
 * Usage: node scripts/promote-vendor.mjs +962790910041
 */

const WORDPRESS_URL = "https://mahallystore-com-646040.hostingersite.com";
const WC_CONSUMER_KEY = "ck_5a63558a058dfee4c1bbe4a65042869e40479bc9";
const WC_CONSUMER_SECRET = "cs_8e8587e5196b378c00c3a6ffe461153ffadaf71a";

const BASE = `${WORDPRESS_URL}/wp-json/wc/v3`;
const AUTH = "Basic " + Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString("base64");

async function wcGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: AUTH } });
  if (!res.ok) throw new Error(`WC GET ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function wcPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`WC PUT ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function findByPhone(rawPhone) {
  const clean = rawPhone.replace(/\D/g, "");
  console.log(`🔍 Searching for phone: ${rawPhone} (digits: ${clean})`);

  // Try multiple roles
  for (const role of ["all", "seller", "administrator", "customer"]) {
    let page = 1;
    while (page <= 5) {
      const customers = await wcGet(`/customers?per_page=100&page=${page}&role=${role}`);
      if (!customers.length) break;
      const found = customers.find((c) => {
        const p = (c.billing?.phone || "").replace(/\D/g, "");
        return p && (p === clean || p.endsWith(clean) || clean.endsWith(p));
      });
      if (found) return found;
      if (customers.length < 100) break;
      page++;
    }
  }
  return null;
}

async function main() {
  const phone = process.argv[2];
  if (!phone) {
    console.error("Usage: node scripts/promote-vendor.mjs +962790910041");
    process.exit(1);
  }

  const user = await findByPhone(phone);
  if (!user) {
    console.error(`❌ No user found with phone ${phone}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ID=${user.id} | ${user.first_name} ${user.last_name} | ${user.email} | role=${user.role}`);

  // Build meta updates
  const metaUpdates = [
    { key: "dokan_enable_selling", value: "yes" },
    { key: "mahally_vendor_status", value: "approved" },
    { key: "mahally_role", value: "vendor" },
  ];

  // Ensure mahally_id exists
  const existingId = user.meta_data?.find((m) => m.key === "mahally_id")?.value;
  if (!existingId || !existingId.startsWith("mah-")) {
    const newId = `mah-vendor-${Date.now()}`;
    metaUpdates.push({ key: "mahally_id", value: newId });
    console.log(`🆔 Assigned new Mahally ID: ${newId}`);
  }

  console.log("📝 Updating meta fields + role to seller...");
  const updated = await wcPut(`/customers/${user.id}`, {
    role: "seller",
    meta_data: metaUpdates,
  });

  console.log(`\n🎉 Done! Account promoted successfully.`);
  console.log(`   ID:     ${updated.id}`);
  console.log(`   Email:  ${updated.email}`);
  console.log(`   Role:   ${updated.role}`);
  console.log(`\n   ✅ dokan_enable_selling = yes`);
  console.log(`   ✅ mahally_vendor_status = approved`);
  console.log(`   ✅ You can now log in and add products from /merchant/dashboard`);
}

main().catch((err) => {
  console.error("💥 Error:", err.message);
  process.exit(1);
});
