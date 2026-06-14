import { NextResponse } from "next/server";

/**
 * POST: Upload a file to the WordPress Media Library
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || process.env.WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");

    // Prepare the form data for WordPress Media API
    const wpFormData = new FormData();
    wpFormData.append("file", file);
    wpFormData.append("title", file.name);
    wpFormData.append("status", "publish");

    const response = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: wpFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("WP Media Upload Error:", error);
      return NextResponse.json({ error: error.message || "Upload failed" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      url: data.source_url,
      id: data.id 
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
