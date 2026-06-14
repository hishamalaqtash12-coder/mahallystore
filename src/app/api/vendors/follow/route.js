import { updateCustomerMeta, getCustomerById } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import { VENDOR_CACHE } from "../[slug]/route";

/**
 * POST /api/vendors/follow
 * Body: { vendorId, userId, action: 'follow' | 'unfollow' }
 */
export async function POST(request) {
  try {
    const { vendorId, userId, action } = await request.json();

    if (!vendorId || !userId) {
      return NextResponse.json({ error: "Vendor ID and User ID are required" }, { status: 400 });
    }

    const parsedVendorId = parseInt(vendorId);
    const parsedUserId = parseInt(userId);

    // Fetch both vendor and user in parallel
    const [vendor, user] = await Promise.all([
      getCustomerById(parsedVendorId),
      getCustomerById(parsedUserId)
    ]);

    const updates = [];

    // 1. Update Vendor Follower Count & IDs
    if (vendor) {
      const meta = Object.fromEntries((vendor.meta_data || []).map(m => [m.key, m.value]));
      
      // Update IDs List first
      let followerIds = meta.mahally_follower_ids ? JSON.parse(meta.mahally_follower_ids) : [];
      followerIds = followerIds.map(id => parseInt(id)).filter(Boolean);

      if (action === 'follow') {
        if (!followerIds.includes(parsedUserId)) followerIds.push(parsedUserId);
      } else {
        followerIds = followerIds.filter(id => id !== parsedUserId);
      }

      // Calculate Count based on ACTUAL list length
      const actualCount = followerIds.length;

      updates.push(updateCustomerMeta(parsedVendorId, { 
        mahally_follower_count: String(actualCount),
        mahally_follower_ids: JSON.stringify(followerIds)
      }));
    }

    // 2. Update User's Followed Stores List
    if (user) {
      const meta = Object.fromEntries((user.meta_data || []).map(m => [m.key, m.value]));
      let followed = meta.mahally_followed_stores ? JSON.parse(meta.mahally_followed_stores) : [];
      followed = followed.map(id => parseInt(id)).filter(Boolean);
      
      if (action === 'follow') {
        if (!followed.includes(parsedVendorId)) followed.push(parsedVendorId);
      } else {
        followed = followed.filter(id => id !== parsedVendorId);
      }

      updates.push(updateCustomerMeta(parsedUserId, { mahally_followed_stores: JSON.stringify(followed) }));
    }

    await Promise.all(updates);

    // Clear vendor profile read cache to ensure changes reflect instantly on reload
    VENDOR_CACHE.clear();
    if (globalThis.VENDOR_CACHE) {
      globalThis.VENDOR_CACHE.clear();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Follow API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
