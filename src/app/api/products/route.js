/**
 * Products API Route
 * Handles fetching products with categories, search filtering,
 * and enrichment with live ratings + Dokan store names.
 */
import { getProducts, getCategories } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const dynamic = 'force-dynamic';
// Stability Stamp: 2026-05-13T12:30 - Cache Purge

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

// Server-side in-memory cache for catalog and category product lists
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function getCachedData(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    apiCache.delete(key); // Evict expired
  }
  return null;
}

function setCachedData(key, data) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Given a vendor (WC customer) object, extract the actual Dokan store name.
 * Checks multiple keys in priority order.
 */
function getStoreNameFromVendor(vendor) {
  if (!vendor) return null;

  // Priority 1: dokan_store_name — set directly in Dokan vendor settings
  const dokanName = vendor.meta_data?.find(m => m.key === "dokan_store_name")?.value;
  if (dokanName) return dokanName;

  // Priority 2: dokan_settings serialized object (older Dokan versions)
  const settings = vendor.meta_data?.find(m => m.key === "dokan_settings")?.value;
  if (settings && typeof settings === "object" && settings.store_name) return settings.store_name;

  // Priority 3: our custom mahally_owner_name
  const mahallyName = vendor.meta_data?.find(m => m.key === "mahally_owner_name")?.value;
  if (mahallyName) return mahallyName;

  return null; // Don't fall back to display_name — that's the user name, not the store name
}

/**
 * Fetch vendor profiles by their IDs, trying both 'customer' and 'seller' roles.
 */
async function fetchVendorProfiles(vendorIds) {
  if (!vendorIds || vendorIds.length === 0) return [];
  const uniqueIds = [...new Set(vendorIds.filter(id => id && !isNaN(id) && id > 0))];
  if (uniqueIds.length === 0) return [];

  const results = [];
  try {
    // Fetch without role filter first (catches admin + regular customers who are vendors)
    const res1 = await api.get("customers", { include: uniqueIds.join(","), per_page: 100 });
    results.push(...(res1.data || []));

    // For any missing IDs, try with 'seller' role (Dokan vendors)
    const foundIds = new Set(results.map(v => v.id));
    const missingIds = uniqueIds.filter(id => !foundIds.has(Number(id)));
    if (missingIds.length > 0) {
      const res2 = await api.get("customers", { include: missingIds.join(","), role: "seller", per_page: 100 });
      results.push(...(res2.data || []));
    }
  } catch (e) {
    console.warn("fetchVendorProfiles error:", e.message);
  }
  return results;
}

/**
 * Enriches a list of products with the actual Dokan store name injected
 * into meta_data as 'merchant_name'. Falls back gracefully.
 */
async function enrichProductsWithStoreName(products) {
  if (!products || products.length === 0) return products;

  try {
    // Step 1: Collect all unique author IDs
    // Dokan sets the product author to the vendor's WordPress user ID
    const authorIds = [...new Set(
      products
        .map(p => {
          // Dokan may also store _vendor_id in product meta
          const metaVendorId = p.meta_data?.find(m => m.key === "_vendor_id")?.value;
          return parseInt(metaVendorId || p.author || 0);
        })
        .filter(id => id > 0)
    )];

    if (authorIds.length === 0) return products;

    // Step 2: Fetch vendor profiles
    const vendors = await fetchVendorProfiles(authorIds);

    // Step 3: Build vendorId -> { storeName, id } map
    const vendorMap = {};
    vendors.forEach(vendor => {
      const storeName = getStoreNameFromVendor(vendor);
      vendorMap[vendor.id] = { storeName, id: vendor.id };
    });

    // Step 4: Inject merchant_name, merchant_id, and is_free_shipping into each product
    return products.map(product => {
      const metaVendorId = product.meta_data?.find(m => m.key === "_vendor_id")?.value;
      const vendorId = parseInt(metaVendorId || product.author || 0);
      const vendor = vendorMap[vendorId];
      
      // Determine if free shipping is active for this product
      const isFreeShipping = 
        product.meta_data?.some(m => m.key === "_dokan_free_shipping" && m.value === "yes") ||
        ["free", "free-shipping"].includes(product.shipping_class?.toLowerCase());

      const cleanedMeta = (product.meta_data || []).filter(
        m => !["merchant_name", "merchant_id"].includes(m.key)
      );

      return {
        ...product,
        is_free_shipping: isFreeShipping,
        meta_data: [
          ...cleanedMeta,
          ...(vendor?.storeName ? [
            { key: "merchant_name", value: vendor.storeName },
            { key: "merchant_id",   value: vendor.id.toString() }
          ] : [])
        ]
      };
    });
  } catch (err) {
    console.warn("enrichProductsWithStoreName failed:", err.message);
    return products; // Return unenriched rather than breaking
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page       = searchParams.get("page")       || 1;
  const per_page   = searchParams.get("per_page")   || 20;
  const q          = searchParams.get("q");
  const cat        = searchParams.get("cat");
  const onDiscount = searchParams.get("onDiscount");
  const vendorId   = searchParams.get("vendor");
  const include    = searchParams.get("include");
  const featured   = searchParams.get("featured");
  const noMerchant = searchParams.get("noMerchant") === "true";
  const includeRestricted = searchParams.get("includeRestricted") === "true";

  // Only cache category catalog queries (no search query, no vendor specific lookup, no custom ID includes)
  const shouldCache = cat && !vendorId && !include && !q && !includeRestricted && featured === null;
  const cacheKey = `products_${page}_${per_page}_${cat || ''}_${onDiscount || ''}_${featured || ''}_${noMerchant}`;

  if (shouldCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  try {
    const options = { page, per_page, status: "publish" };

    if (onDiscount === "true") options.on_sale = true;
    if (vendorId) options.author = vendorId; // Dokan stores products by user ID (author)
    if (include) options.include = include;
    if (featured !== null) options.featured = featured === "true";

    // Resolve category slug → ID
    if (cat) {
      const categories = await getCategories({ hide_empty: false, per_page: 100 });
      const found = categories.find(c => c.slug === cat);
      if (found) {
        options.category = found.id;
      } else {
        return NextResponse.json({ products: [], totalPages: 0, total: 0 });
      }
    }

    if (q) options.search = q;

    const { data, totalPages, total } = await getProducts(options, false, 3, includeRestricted);

    // Manually filter by vendor ID since standard WooCommerce REST API often ignores the `author` parameter
    let finalData = data;
    if (vendorId) {
      finalData = data.filter(p => {
        const metaVendorId = p.meta_data?.find(m => m.key === "_vendor_id" || m.key === "mahally_owner_id" || m.key === "merchant_id")?.value;
        const authorId = parseInt(metaVendorId || p.author || 0);
        return authorId === parseInt(vendorId);
      });
    }

    // Parallelize Enrichment (Dokan Store names) and Live Ratings
    let enrichedData = finalData;
    let productReviewsMap = {};

    const productIds = finalData.map(p => p.id);

    try {
      const enrichmentPromise = !noMerchant 
        ? enrichProductsWithStoreName(finalData) 
        : Promise.resolve(finalData.map(product => {
            const isFreeShipping = 
              product.meta_data?.some(m => m.key === "_dokan_free_shipping" && m.value === "yes") ||
              ["free", "free-shipping"].includes(product.shipping_class?.toLowerCase());
            return {
              ...product,
              is_free_shipping: isFreeShipping
            };
          }));

      const reviewsPromise = productIds.length > 0 
        ? api.get("products/reviews", {
            product: productIds.join(","),
            status: "approved",
            per_page: 100
          }).catch(err => {
            console.warn("Live ratings fetch failed:", err.message);
            return { data: [] };
          })
        : Promise.resolve({ data: [] });

      const [enrichedResults, reviewsRes] = await Promise.all([enrichmentPromise, reviewsPromise]);
      enrichedData = enrichedResults;

      const allReviews = reviewsRes.data || [];
      allReviews.forEach(r => {
        const pid = r.product_id;
        if (!productReviewsMap[pid]) {
          productReviewsMap[pid] = [];
        }
        productReviewsMap[pid].push(r);
      });

      // Apply ratings to enriched data
      enrichedData = enrichedData.map(product => {
        const pReviews = productReviewsMap[product.id] || [];
        const count = pReviews.length;
        const avg = count > 0 
          ? parseFloat((pReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
          : 0;

        return {
          ...product,
          average_rating: count > 0 ? avg.toString() : product.average_rating,
          rating_count: count > 0 ? count : product.rating_count
        };
      });

    } catch (err) {
      console.warn("Parallel enrichment failed:", err.message);
    }

    const responseData = { products: enrichedData, totalPages, total: vendorId ? finalData.length : total };

    if (shouldCache) {
      setCachedData(cacheKey, responseData);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Products API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
