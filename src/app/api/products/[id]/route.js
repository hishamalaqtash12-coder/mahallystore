import { getProduct, getProductVariations } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const dynamic = 'force-dynamic';

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

/**
 * Extracts the Dokan store name from a vendor (WC customer) object.
 */
function getStoreNameFromVendor(vendor) {
  if (!vendor) return null;
  const dokanName = vendor.meta_data?.find(m => m.key === "dokan_store_name")?.value;
  if (dokanName) return dokanName;
  const settings = vendor.meta_data?.find(m => m.key === "dokan_settings")?.value;
  if (settings && typeof settings === "object" && settings.store_name) return settings.store_name;
  const mahallyName = vendor.meta_data?.find(m => m.key === "mahally_owner_name")?.value;
  if (mahallyName) return mahallyName;
  return null;
}

/**
 * Fetches a single vendor profile, trying both regular customer and seller role.
 */
async function fetchVendorProfile(vendorId) {
  if (!vendorId || isNaN(vendorId) || vendorId <= 0) return null;
  try {
    const res = await api.get(`customers/${vendorId}`);
    return res.data || null;
  } catch (e) {
    // Might be a seller role — try with role filter
    try {
      const res2 = await api.get("customers", { include: vendorId.toString(), role: "seller", per_page: 10 });
      return res2.data?.[0] || null;
    } catch {
      return null;
    }
  }
}

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const product = await getProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch variations for variable products
    let variations = [];
    if (product.type === "variable") {
      variations = await getProductVariations(id);
    }

    // Enrich with Dokan store name and Live Rating in parallel
    const metaVendorId = product.meta_data?.find(m => m.key === "_vendor_id")?.value;
    const vendorId = parseInt(metaVendorId || product.author || 0);

    const vendorProfilePromise = vendorId > 0 
      ? fetchVendorProfile(vendorId).catch(err => {
          console.warn(`Store name enrichment failed for product ${id}:`, err.message);
          return null;
        })
      : Promise.resolve(null);

    const reviewsPromise = api.get("products/reviews", {
      product: id,
      status: "approved",
      per_page: 100
    }).catch(err => {
      console.warn(`Live rating enrichment failed for product ${id}:`, err.message);
      return { data: null };
    });

    const [vendor, reviewsRes] = await Promise.all([vendorProfilePromise, reviewsPromise]);

    if (vendor) {
      const storeName = getStoreNameFromVendor(vendor);
      if (storeName) {
        const cleanedMeta = (product.meta_data || []).filter(
          m => !["merchant_name", "merchant_id"].includes(m.key)
        );
        product.meta_data = [
          ...cleanedMeta,
          { key: "merchant_name", value: storeName },
          { key: "merchant_id",   value: vendorId.toString() }
        ];
      }
    }
    
    // Explicitly add vendorId at top level so checkout/cart can easily access it
    product.vendorId = vendorId;

    if (reviewsRes && reviewsRes.data) {
      const allReviews = reviewsRes.data;
      const count = allReviews.length;
      const avg = count > 0 
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
        : "0.0";
      
      product.average_rating = count > 0 ? avg : product.average_rating;
      product.rating_count = count > 0 ? count : product.rating_count;
    }

    return NextResponse.json({ ...product, variations_data: variations });
  } catch (error) {
    console.error(`Product API [${id}] error:`, error.message);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
