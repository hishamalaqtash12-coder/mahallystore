import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";
import { wcApi } from "@/lib/woocommerce";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get("wooId");

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    let reviews = [];
    try {
      // Try Dokan REST API first
      const dokanReviews = await dokanApi.getReviews(wooId);
      if (Array.isArray(dokanReviews)) {
        reviews = dokanReviews;
      } else if (dokanReviews && dokanReviews.code) {
        throw new Error(dokanReviews.message);
      }
    } catch (err) {
      console.warn("Dokan reviews fetch failed, falling back to WC API:", err.message);
    }

    // Fallback/Supplement: If Dokan returns empty or fails, fetch via WC API and filter by product ownership
    if (!Array.isArray(reviews) || reviews.length === 0) {
      let vendorProducts = [];
      
      // Attempt 1: Dokan API
      try {
        const dp = await dokanApi.getProducts(wooId);
        if (Array.isArray(dp)) vendorProducts = dp;
      } catch (e) { 
        console.warn("Dokan products fetch failed in reviews fallback:", e.message); 
      }

      // Attempt 2: WC API with vendor param
      if (vendorProducts.length === 0) {
        try {
          const res = await wcApi.get("products", { vendor: wooId, per_page: 100, status: 'any' });
          if (Array.isArray(res.data)) vendorProducts = res.data;
        } catch (e) { 
          console.warn("WC vendor products fetch failed in reviews fallback:", e.message); 
        }
      }

      // Attempt 3: WC API with author filter
      if (vendorProducts.length === 0) {
        try {
          const res = await wcApi.get("products", { per_page: 100, status: 'any' });
          if (Array.isArray(res.data)) {
            vendorProducts = res.data.filter(p => 
              String(p.author) === String(wooId) || 
              p.meta_data?.some(m => (m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id') && String(m.value) === String(wooId))
            );
          }
        } catch (e) { 
          console.warn("WC author products fetch failed in reviews fallback:", e.message); 
        }
      }

      // Filter products to ensure strict isolation
      const filteredProducts = (Array.isArray(vendorProducts) ? vendorProducts : []).filter(p => {
        const authorId = String(p.author || p.post_author || "");
        const vendorIdMatch = String(p.store?.id || p.vendor?.id || "");
        const metaVendorId = p.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
        
        return authorId === String(wooId) || 
               vendorIdMatch === String(wooId) || 
               String(metaVendorId) === String(wooId);
      });

      const productIds = new Set(filteredProducts.map(p => p.id));

      if (productIds.size > 0) {
        const wcReviews = await wcApi.get("products/reviews", { per_page: 100 });
        const allReviews = Array.isArray(wcReviews.data) ? wcReviews.data : [];
        reviews = allReviews.filter(r => productIds.has(r.product_id));
      }
    }

    // Enrich reviews with product names if not already present
    if (reviews.length > 0) {
      const missingProductIds = [...new Set(reviews.filter(r => !r.product_name).map(r => r.product_id))];
      if (missingProductIds.length > 0) {
        try {
          const prodRes = await wcApi.get("products", { include: missingProductIds.join(","), per_page: 100 });
          const productsMap = {};
          (prodRes.data || []).forEach(p => {
            productsMap[p.id] = p.name;
          });
          reviews.forEach(r => {
            if (!r.product_name && productsMap[r.product_id]) {
              r.product_name = productsMap[r.product_id];
            }
          });
        } catch (e) {
          console.warn("Failed to enrich product names for merchant reviews:", e.message);
        }
      }
    }

    return NextResponse.json(Array.isArray(reviews) ? reviews : []);
  } catch (error) {
    console.error("Merchant reviews error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { reviewId, reply, wooId } = await request.json();

    if (!reviewId || !reply || !wooId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Dokan REST API usually handles replies as comments or through a specific endpoint
    // In many Dokan setups, you just POST to the review endpoint
    const res = await dokanApi.fetch(`reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ 
        vendor_id: wooId,
        content: reply 
      })
    });

    return NextResponse.json(res);
  } catch (error) {
    console.error("Review reply error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const res = await wcApi.delete(`products/reviews/${id}`, { force: true });
    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Review delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
