import { NextResponse } from 'next/server';
// Stability Stamp: 2026-05-13T12:30 - Cache Purge
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

/**
 * Fetches a vendor's display name by their user ID.
 * Tries both 'customer' and 'seller' roles since Dokan vendors may have either.
 */
async function fetchVendorsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const uniqueIds = [...new Set(ids.filter(id => id && !isNaN(id) && id > 0))];
  if (uniqueIds.length === 0) return [];

  const results = [];
  try {
    // First try without role filter (catches admin + customers who are also vendors)
    const res1 = await api.get("customers", { include: uniqueIds.join(','), per_page: 100 });
    results.push(...(res1.data || []));

    // Find which IDs are still missing and try with 'seller' role
    const foundIds = new Set(results.map(v => v.id));
    const missingIds = uniqueIds.filter(id => !foundIds.has(Number(id)));
    if (missingIds.length > 0) {
      const res2 = await api.get("customers", { include: missingIds.join(','), role: 'seller', per_page: 100 });
      results.push(...(res2.data || []));
    }
  } catch (e) {
    console.error("fetchVendorsByIds error:", e.message);
  }
  return results;
}

/**
 * Extracts the store name from a vendor (WC customer) object.
 * Checks multiple Dokan metadata keys in priority order.
 */
function getStoreNameFromVendor(vendor) {
  if (!vendor) return null;

  // Priority 1: dokan_store_name meta (most reliable for Dokan)
  const dokanName = vendor.meta_data?.find(m => m.key === "dokan_store_name")?.value;
  if (dokanName) return dokanName;

  // Priority 2: dokan_settings serialized object (older Dokan versions)
  const settings = vendor.meta_data?.find(m => m.key === "dokan_settings")?.value;
  if (settings && typeof settings === 'object' && settings.store_name) return settings.store_name;

  // Priority 3: mahally_owner_name (our custom meta)
  const mahallyName = vendor.meta_data?.find(m => m.key === "mahally_owner_name")?.value;
  if (mahallyName) return mahallyName;

  // Priority 4: WC display name
  if (vendor.display_name) return vendor.display_name;

  // Priority 5: Full name
  const fullName = `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim();
  if (fullName) return fullName;

  return null;
}

/**
 * Enriches orders: adds merchant_name and merchant_id to each line_item.
 * Strategy: check item meta → check product author → look up vendor profile.
 */
async function enrichOrdersWithVendorInfo(orders) {
  if (!orders || orders.length === 0) return [];

  try {
    // Step 1: Map item keys to their vendor IDs (check item meta first)
    const itemKeyToVendorId = {}; // `${orderId}-${itemId}` -> vendorId (number)
    const productIdsNeedingLookup = new Set();

    orders.forEach(order => {
      (order.line_items || []).forEach(item => {
        const key = `${order.id}-${item.id}`;
        // Check if Dokan stored the vendor ID directly in the line item meta
        const inlineMeta = item.meta_data?.find(
          m => m.key === "_vendor_id" || m.key === "seller_id" || m.key === "vendor_id"
        )?.value;

        if (inlineMeta && !isNaN(parseInt(inlineMeta))) {
          itemKeyToVendorId[key] = parseInt(inlineMeta);
        } else {
          productIdsNeedingLookup.add(item.product_id);
        }
      });
    });

    // Step 2: For items without vendor ID in meta, fetch products to get the author
    const productToVendorId = {}; // productId -> vendorId (number)
    if (productIdsNeedingLookup.size > 0) {
      const pIds = [...productIdsNeedingLookup].filter(id => id > 0);
      // Fetch in batches of 50
      for (let i = 0; i < pIds.length; i += 50) {
        const batch = pIds.slice(i, i + 50);
        try {
          const res = await api.get("products", { include: batch.join(','), per_page: 100 });
          (res.data || []).forEach(product => {
            // Dokan stores vendor ID in product meta as _vendor_id or via store object
            const vendorIdFromMeta = product.meta_data?.find(m => m.key === "_vendor_id")?.value;
            const vendorIdFromStore = product.store?.id;
            const vendorId = parseInt(vendorIdFromMeta || vendorIdFromStore || product.author || 0);
            if (vendorId > 0) productToVendorId[product.id] = vendorId;
          });
        } catch (e) {
          console.warn("Product batch fetch error:", e.message);
        }
      }

      // Fill in itemKeyToVendorId from productToVendorId
      orders.forEach(order => {
        (order.line_items || []).forEach(item => {
          const key = `${order.id}-${item.id}`;
          if (!itemKeyToVendorId[key] && productToVendorId[item.product_id]) {
            itemKeyToVendorId[key] = productToVendorId[item.product_id];
          }
        });
      });
    }

    // Step 3: Collect all unique vendor IDs and fetch their profiles
    const allVendorIds = [...new Set(Object.values(itemKeyToVendorId))];
    const vendorProfiles = await fetchVendorsByIds(allVendorIds);

    // Build a map: vendorId -> { name, id, phone, email }
    const vendorMap = {};
    vendorProfiles.forEach(vendor => {
      const phoneMeta = vendor.meta_data?.find(m => m.key === 'mahally_whatsapp_number' || m.key === 'billing_phone');
      const phone = phoneMeta?.value || vendor.billing?.phone || "";
      vendorMap[vendor.id] = {
        id: vendor.id,
        name: getStoreNameFromVendor(vendor) || `Vendor #${vendor.id}`,
        phone: phone,
        email: vendor.email || ""
      };
    });

    // Step 4: Inject merchant_name, merchant_id, merchant_phone, and merchant_email into each line_item
    return orders.map(order => ({
      ...order,
      line_items: (order.line_items || []).map(item => {
        const key = `${order.id}-${item.id}`;
        const vendorId = itemKeyToVendorId[key];
        const vendor = vendorMap[vendorId];

        const merchantName = vendor?.name || (vendorId === 1 ? "Mahally Official" : null);
        const merchantId = vendor?.id || vendorId || null;
        const merchantPhone = vendor?.phone || "";
        const merchantEmail = vendor?.email || "";

        // Strip out old meta keys and inject fresh ones
        const cleanedMeta = (item.meta_data || []).filter(
          m => !["merchant_name", "merchant_id", "merchant_phone", "merchant_email", "_vendor_id", "seller_id"].includes(m.key)
        );

        return {
          ...item,
          meta_data: [
            ...cleanedMeta,
            { key: "merchant_name", value: merchantName || "Unknown Seller" },
            { key: "merchant_id", value: merchantId ? merchantId.toString() : "" },
            { key: "merchant_phone", value: merchantPhone },
            { key: "merchant_email", value: merchantEmail }
          ]
        };
      })
    }));
  } catch (err) {
    console.error("enrichOrdersWithVendorInfo failed:", err.message);
    return orders; // return raw orders rather than breaking
  }
}

export const dynamic = 'force-dynamic';
// Stability Stamp: 2026-05-13T12:30 - Cache Purge
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const customerId = searchParams.get('customerId');

    let allOrders = [];

    if (customerId && customerId !== 'null' && customerId !== 'undefined') {
      // Path A: Fetch by WooCommerce Customer ID (most reliable)
      const res = await api.get("orders", { customer: parseInt(customerId), per_page: 50 });
      allOrders = res.data || [];
    } else if (email && email !== 'null' && email !== 'undefined') {
      // Path B: Fetch by email (fallback for users without a WooCommerce ID)
      const customersRes = await api.get("customers", { email });
      const foundId = customersRes.data?.[0]?.id || null;

      const [byId, byEmail] = await Promise.all([
        foundId
          ? api.get("orders", { customer: foundId, per_page: 50 })
          : Promise.resolve({ data: [] }),
        api.get("orders", { search: email, per_page: 50 })
      ]);

      const idOrders = byId.data || [];
      const emailOrders = (byEmail.data || []).filter(
        o => o.billing?.email?.toLowerCase() === email.toLowerCase()
      );

      allOrders = [...idOrders];
      emailOrders.forEach(o => {
        if (!allOrders.find(x => x.id === o.id)) allOrders.push(o);
      });
    } else {
      return NextResponse.json({ error: 'Valid email or customerId is required' }, { status: 400 });
    }

    allOrders.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
    const enriched = await enrichOrdersWithVendorInfo(allOrders);

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Orders API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
