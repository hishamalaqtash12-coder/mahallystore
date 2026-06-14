import { NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const WP_ADMIN_USER = process.env.WP_ADMIN_USER;
const WP_ADMIN_APP_PASS = process.env.WP_ADMIN_APP_PASS;

/**
 * Creates a user via the WordPress REST API using Application Passwords.
 * This is the ONLY method that correctly fires all WordPress & Dokan hooks:
 *   - user_register
 *   - dokan_new_vendor
 *   - wp_insert_user
 * ...ensuring the user appears in wp-admin Users list AND Dokan's Pending list.
 */
async function createWordPressUser(userData) {
  const credentials = Buffer.from(`${WP_ADMIN_USER}:${WP_ADMIN_APP_PASS}`).toString("base64");

  const res = await fetch(`${WP_URL}/wp-json/wp/v2/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `WordPress API error: ${res.status}`);
  }

  return data;
}

/**
 * Updates user meta via the WordPress REST API.
 * We must set Dokan-specific meta separately since /wp/v2/users
 * only exposes a limited set of fields.
 */
async function updateWordPressUserMeta(userId, metaKey, metaValue) {
  const credentials = Buffer.from(`${WP_ADMIN_USER}:${WP_ADMIN_APP_PASS}`).toString("base64");

  // WordPress REST API allows updating meta via the users/{id} endpoint
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/users/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      meta: {
        [metaKey]: metaValue,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn(`Failed to update meta ${metaKey} for user ${userId}:`, err.message);
  }
}

/**
 * Uses WooCommerce REST API to update specific fields that the WP API can't handle.
 */
async function updateViaWooCommerceApi(userId, payload) {
  const credentials = Buffer.from(`${WP_ADMIN_USER}:${WP_ADMIN_APP_PASS}`).toString("base64");

  const res = await fetch(
    `${WP_URL}/wp-json/wc/v3/customers/${userId}`,
    {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.warn(`WooCommerce update for user ${userId} failed:`, data.message);
  }
  return data;
}

export async function POST(request) {
  try {
    const { email, phone, name, password, role = "customer", storeData = {} } = await request.json();

    if (!email || !phone || !name) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    if (!WP_ADMIN_USER || !WP_ADMIN_APP_PASS) {
      return NextResponse.json(
        { error: "Server configuration error: WordPress admin credentials are not set." },
        { status: 500 }
      );
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const storeSlug = (storeData.storeName || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Create user via WordPress REST API
    // Role 'seller' for vendors, 'customer' for regular users.
    // This fires wp_insert_user + all associated WordPress hooks.
    // ─────────────────────────────────────────────────────────────────
    const wpUserPayload = {
      username: email.split("@")[0] + "_" + Date.now().toString().slice(-4),
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      roles: [role === "vendor" ? "seller" : "customer"],
      // meta is limited to registered meta keys via REST API.
      // We'll use a separate call for Dokan-specific meta.
      meta: {
        mahally_role: role,
        mahally_vendor_status: role === "vendor" ? "pending" : "approved",
      },
    };

    const newUser = await createWordPressUser(wpUserPayload);
    const userId = newUser.id;

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Set all Dokan & Mahally-specific meta via WooCommerce API
    // WC REST API has full meta_data support with no restrictions.
    // This is the reliable way to set dokan_profile_settings etc.
    // ─────────────────────────────────────────────────────────────────
    if (role === "vendor") {
      const dokanProfileSettings = {
        store_name: storeData.storeName || name,
        social: { fb: "", twitter: "", youtube: "", linkedin: "", pinterest: "", instagram: "" },
        payment: {
          paypal: { email: email },
          bank: { ac_name: name, ac_number: "", bank_name: "", bank_addr: "", routing_number: "" },
        },
        phone: phone,
        show_email: "no",
        address: { street_1: "", street_2: "", city: "", zip: "", country: "JO", state: "" },
        location: "",
        banner: 0,
        icon: 0,
        gravatar: 0,
        profile_completion: { progress: 20, progress_vals: { store_name: 0, phone: 0, address: 0, profile_picture: 0, store_banner: 0 } },
      };

      await updateViaWooCommerceApi(userId, {
        billing: { phone, first_name: firstName, last_name: lastName, email },
        meta_data: [
          { key: "mahally_role",              value: "vendor" },
          { key: "mahally_vendor_status",     value: "pending" },
          { key: "mahally_store_name",        value: storeData.storeName || name },
          { key: "mahally_store_slug",        value: storeSlug },
          { key: "mahally_store_description", value: storeData.storeDescription || "" },
          { key: "mahally_store_category",    value: storeData.storeCategory || "" },
          { key: "mahally_id",                value: `vendor_${userId}` },
          { key: "billing_phone",             value: phone },
          { key: "phone",                     value: phone },
          // Auto-seed WhatsApp & store phone from the verified registration phone number
          { key: "mahally_store_phone",       value: phone },
          { key: "mahally_whatsapp_number",   value: phone },
          { key: "mahally_show_whatsapp",     value: "yes" },
          // Dokan native meta — must exist for Dokan to recognize this as a vendor
          { key: "dokan_enable_selling",      value: "no" },
          { key: "dokan_store_name",          value: storeData.storeName || name },
          { key: "dokan_profile_settings",    value: dokanProfileSettings },
          { key: "dokan_publishing",          value: "no" },
        ],
      });
    } else {
      // Customer: set billing info
      await updateViaWooCommerceApi(userId, {
        billing: { phone, first_name: firstName, last_name: lastName, email },
        meta_data: [
          { key: "mahally_role", value: "customer" },
          { key: "mahally_vendor_status", value: "approved" },
          { key: "mahally_id", value: `cust_${userId}` },
          { key: "billing_phone", value: phone }, // Explicitly set for WP Admin visibility
          { key: "phone", value: phone },         // Explicitly set for WP Admin visibility
        ],
      });
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: userId,
        email,
        role: role === "vendor" ? "seller" : "customer",
        vendorStatus: role === "vendor" ? "pending" : "approved",
      },
    });
  } catch (error) {
    console.error("Register user API error:", error);

    // Surface duplicate email/username errors clearly
    if (error.message?.includes("existing_user_email") || error.message?.includes("existing_user_login")) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: error.message || "Failed to register user" }, { status: 500 });
  }
}
