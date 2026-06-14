import { NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");

export async function PUT(request) {
  try {
    const { id, type, is_restricted, restriction_reason, show_in_carousel, show_in_directory } = await request.json();

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const endpoint = type === 'vendor' ? `/wp-json/wc/v3/customers/${id}` : `/wp-json/wc/v3/products/${id}`;
    
    // First, fetch existing item to get current meta_data and their IDs
    const existingRes = await fetch(`${WP_URL}${endpoint}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    if (!existingRes.ok) {
       return NextResponse.json({ error: "Failed to fetch existing data" }, { status: existingRes.status });
    }
    
    const existing = await existingRes.json();
    const currentMeta = existing.meta_data || [];

    const updates = {
      mahally_is_restricted: is_restricted ? 'yes' : 'no',
      mahally_restriction_reason: restriction_reason || ''
    };

    if (type === 'vendor') {
      if (typeof show_in_carousel !== 'undefined') {
        updates.mahally_show_in_carousel = show_in_carousel ? 'yes' : 'no';
      }
      if (typeof show_in_directory !== 'undefined') {
        updates.mahally_show_in_directory = show_in_directory ? 'yes' : 'no';
      }
    }

    // Prepare only the meta fields we are updating
    const metaToUpdate = [];
    for (const [key, value] of Object.entries(updates)) {
      const existingMeta = currentMeta.find(m => m.key === key);
      if (existingMeta && existingMeta.id) {
        metaToUpdate.push({ id: existingMeta.id, key, value });
      } else {
        metaToUpdate.push({ key, value });
      }
    }

    const body = { meta_data: metaToUpdate };

    const res = await fetch(`${WP_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || "Failed to update visibility" }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Visibility update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
