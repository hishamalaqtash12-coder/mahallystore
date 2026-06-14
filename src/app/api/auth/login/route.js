// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Expected env: NEXT_PUBLIC_WORDPRESS_URL (e.g. https://example.com)
const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/*$/, "");
const JWT_ENDPOINT = `${WP_URL}/wp-json/jwt-auth/v1/token`;

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3",
});

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    let resolvedEmail = email;
    let userData = null;

    // 1. Try JWT endpoint first
    try {
      const jwtResp = await fetch(JWT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      
      if (jwtResp.ok) {
        const jwtData = await jwtResp.json();
        if (jwtData.token) {
          resolvedEmail = jwtData.user?.email || email;
          return createAuthResponse(jwtData.token, jwtData.user);
        }
      } else {
        const jwtData = await jwtResp.json();
        // If it's a "No route found" error, we continue to fallback
        if (jwtData.code !== "rest_no_route") {
          return NextResponse.json({ error: jwtData.message || "Invalid credentials" }, { status: 401 });
        }
      }
    } catch (e) {
      console.warn("JWT attempt failed, trying fallback...");
    }

    // 2. Fallback: Verify via standard WordPress API using Basic Auth
    try {
      const basicAuth = Buffer.from(`${email}:${password}`).toString("base64");
      const fallbackResp = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${basicAuth}`
        },
      });

      if (fallbackResp.ok) {
        userData = await fallbackResp.json();
        resolvedEmail = userData.email || email;
        return createAuthResponse("verified-via-basic-auth", {
          email: resolvedEmail,
          id: userData.id,
          name: userData.name
        });
      }
    } catch (e) {
      console.warn("Basic Auth fallback failed");
    }

    // 3. Ultra Fallback: XML-RPC
    try {
      const xmlPayload = `<?xml version="1.0" encoding="iso-8859-1"?>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param><value><string>${email}</string></value></param>
    <param><value><string>${password}</string></value></param>
  </params>
</methodCall>`;

      const xmlResp = await fetch(`${WP_URL}/xmlrpc.php`, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlPayload,
      });
      const xmlData = await xmlResp.text();

      if (xmlData.includes("<name>blogName</name>") || xmlData.includes("isAdmin")) {
        // Verification success! Now resolve the actual email using the Admin API
        // because XML-RPC doesn't return it directly.
        try {
          const searchRes = await api.get("customers", { search: email, role: 'all' });
          if (searchRes.data?.length > 0) {
            resolvedEmail = searchRes.data[0].email;
            userData = searchRes.data[0];
          }
        } catch (e) {
          console.warn("WooCommerce lookup failed after XML-RPC success");
        }

        return createAuthResponse("verified-via-xmlrpc", {
          email: resolvedEmail,
          name: email.split('@')[0]
        });
      }
    } catch (e) {
      console.warn("XML-RPC fallback failed");
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function createAuthResponse(token, user) {
  const response = NextResponse.json({ success: true, user: user || null });
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
