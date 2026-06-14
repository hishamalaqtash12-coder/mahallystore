import { getVendors, getProducts } from "@/lib/woocommerce";
import { fetchGraphQL } from "@/lib/graphql";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/vendors — public list of approved vendors */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("search")?.toLowerCase();
  const excludeId = searchParams.get("excludeId");
  const includeRestricted = searchParams.get("includeRestricted") === "true";

  try {
    const [vendors, productsRes] = await Promise.all([
      getVendors({ includeRestricted }),
      getProducts({ per_page: 100 }, false, 3, includeRestricted)
    ]);

    const allProducts = productsRes?.data || [];

    // 1. Filter out the excluded ID immediately
    let filteredVendors = vendors;
    if (excludeId) {
      filteredVendors = vendors.filter(v => String(v.id) !== String(excludeId));
    }

    if (!includeRestricted) {
      filteredVendors = filteredVendors.filter(v => {
        const showInDirectory = v.meta_data?.find(m => m.key === 'mahally_show_in_directory')?.value;
        return showInDirectory !== 'no';
      });
    }

    // 2. Shape into a clean public payload
    let safe = filteredVendors.map((v) => {
      const meta = Object.fromEntries((v.meta_data || []).map((m) => [m.key, m.value]));
      let dokan = meta.dokan_profile_settings || {};
      if (typeof dokan === 'string') {
        try { dokan = JSON.parse(dokan); } catch(e) { dokan = {}; }
      }

      // Prefer our own mahally_ keys — dokan gravatar_url/banner_url are not
      // populated when we save via the REST API directly
      const storeLogo   = meta.mahally_avatar_url   || meta.mahally_store_logo   || dokan.gravatar_url || null;
      const storeBanner = meta.mahally_store_banner  || dokan.banner_url   || null;

      // Find products for this vendor and compute average rating
      const vendorProducts = allProducts.filter(p => {
        const metaVendorId = p.meta_data?.find(m => m.key === "_vendor_id" || m.key === "mahally_owner_id" || m.key === "merchant_id")?.value;
        return parseInt(metaVendorId || p.author || 0) === parseInt(v.id);
      });

      const ratedProducts = vendorProducts.filter(p => Number(p.average_rating || 0) > 0);
      const storeTotalRating = ratedProducts.reduce((sum, p) => sum + Number(p.average_rating || 0), 0);
      const storeReviewCount = ratedProducts.length;
      const rating = storeReviewCount > 0 ? parseFloat((storeTotalRating / storeReviewCount).toFixed(1)) : 0;

      return {
        id: v.id,
        name: `${v.first_name} ${v.last_name}`.trim(),
        storeName: dokan.store_name || meta.mahally_store_name || v.first_name || "Merchant",
        storeSlug: dokan.store_name?.toLowerCase().replace(/\s+/g, '-') || meta.mahally_store_slug || "",
        storeLogo,
        storeBanner,
        storeDescription: dokan.store_description || meta.mahally_store_description || "",
        storeCategory: meta.mahally_store_category || "",
        rating: rating,
        averageRating: rating.toFixed(1),
        isVerified: true
      };
    });

    // If admin is requesting raw data including restricted items
    if (includeRestricted) {
      return NextResponse.json(filteredVendors);
    }

    // Apply Search Filter
    if (q) {
      safe = safe.filter(v => 
        v.storeName.toLowerCase().includes(q) || 
        v.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ vendors: safe });
  } catch (error) {
    console.error("Vendors API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
