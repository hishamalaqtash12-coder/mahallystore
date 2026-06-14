import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, ""); // Remove trailing slash
    
    // Credentials
    const user = process.env.WP_ADMIN_USER || process.env.WC_CONSUMER_KEY;
    const pass = (process.env.WP_ADMIN_APP_PASS || process.env.WC_CONSUMER_SECRET || "").replace(/\s/g, "");
    
    if (!process.env.WP_ADMIN_APP_PASS) {
      console.warn("⚠️ MEDIA UPLOAD: Using WooCommerce Keys (ck/cs). This often fails for media. Please set WP_ADMIN_APP_PASS in .env");
    }

    const auth = Buffer.from(`${user}:${pass}`).toString("base64");

    console.log(`🚀 Attempting media upload to: ${wpUrl}/wp-json/wp/v2/media using user: ${user}`);

    const response = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Type": file.type,
        "Authorization": `Basic ${auth}`,
      },
      body: buffer,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ WordPress Media API Error:", data);
      return NextResponse.json({ 
        error: data.message || "WordPress rejected the upload. Check your Application Password.",
        details: data.code
      }, { status: response.status });
    }

    return NextResponse.json({
      id: data.id,
      url: data.source_url,
    });
  } catch (error) {
    console.error("Media Upload Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
