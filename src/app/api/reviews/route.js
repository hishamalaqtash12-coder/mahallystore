import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function POST(request) {
  try {
    const { productId, rating, review, reviewer, reviewerEmail, userId } = await request.json();

    if (!productId || !rating || !review) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Submit the review
    const response = await api.post("products/reviews", {
      product_id: productId,
      review: review,
      reviewer: reviewer || "Mahally Customer",
      reviewer_email: reviewerEmail || "customer@mahally.jo",
      reviewer_id: userId || 0, // Link to the actual user account
      rating: rating,
      status: "approved"
    });

    // Note: average_rating is a read-only computed field in WooCommerce.
    // Live ratings are enriched server-side when products are fetched via /api/products.
    return NextResponse.json({ ...response.data, _submitted: true });
  } catch (error) {
    console.error("Review Submission API error:", error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

// GET: Fetch reviews for a product with computed average
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const userId = searchParams.get("user_id");
    const email = searchParams.get("email");

    const params = {
      per_page: 100
    };

    if (productId) {
      params.product = productId;
      params.status = "approved"; // Only show approved reviews on product pages
    }
    
    if (email) {
      params.reviewer_email = email;
    } else if (userId) {
      try {
        const customer = await api.get(`customers/${userId}`);
        if (customer.data?.email) {
          params.reviewer_email = customer.data.email;
        } else {
          params.reviewer = userId;
        }
      } catch (custErr) {
        params.reviewer = userId;
      }
    } else if (!productId) {
      params.status = "approved"; // Default to approved for general lists
    }

    const res = await api.get("products/reviews", params);

    const reviews = Array.isArray(res.data) ? res.data : [];

    // Enrich with product details (name, image, permalink) and order info if it's for a user
    if ((email || userId) && reviews.length > 0) {
      // 1. Fetch customer orders
      let customerOrders = [];
      try {
        const orderParams = { per_page: 50 };
        if (userId) {
          orderParams.customer = parseInt(userId);
        } else if (email) {
          orderParams.search = email;
        }
        const ordersRes = await api.get("orders", orderParams);
        if (Array.isArray(ordersRes.data)) {
          customerOrders = ordersRes.data;
        }
      } catch (err) {
        console.warn("Failed to fetch customer orders for reviews enrichment:", err.message);
      }

      // 2. Fetch products details
      const productIds = [...new Set(reviews.map(r => r.product_id))];
      if (productIds.length > 0) {
        try {
          const productsRes = await api.get("products", { include: productIds.join(","), per_page: 100 });
          const productsMap = {};
          
          // Collect all vendor IDs from products
          const vendorIds = [];
          (productsRes.data || []).forEach(p => {
            const vendorIdFromMeta = p.meta_data?.find(m => m.key === "_vendor_id")?.value;
            const vendorIdFromStore = p.store?.id;
            const vendorId = parseInt(vendorIdFromMeta || vendorIdFromStore || p.author || 0);
            if (vendorId > 0) vendorIds.push(vendorId);
          });

          // Fetch actual vendor profiles from WordPress to get the correct store names
          const vendorMap = {};
          if (vendorIds.length > 0) {
            try {
              const uniqueVendorIds = [...new Set(vendorIds)];
              // Try WooCommerce customers API first
              const vendorsRes1 = await api.get("customers", { include: uniqueVendorIds.join(","), per_page: 100 });
              let vendorsData = vendorsRes1.data || [];
              
              // For any missing IDs, try with 'seller' role
              const foundVendorIds = new Set(vendorsData.map(v => v.id));
              const missingVendorIds = uniqueVendorIds.filter(id => !foundVendorIds.has(id));
              if (missingVendorIds.length > 0) {
                const vendorsRes2 = await api.get("customers", { include: missingVendorIds.join(","), role: "seller", per_page: 100 });
                if (vendorsRes2.data) {
                  vendorsData = [...vendorsData, ...vendorsRes2.data];
                }
              }

              // Extract store name from each vendor
              const getStoreNameFromVendor = (v) => {
                if (!v) return null;
                const dokanName = v.meta_data?.find(m => m.key === "dokan_store_name")?.value;
                if (dokanName) return dokanName;
                const settings = v.meta_data?.find(m => m.key === "dokan_settings")?.value;
                if (settings && typeof settings === "object" && settings.store_name) return settings.store_name;
                const mahallyName = v.meta_data?.find(m => m.key === "mahally_owner_name")?.value;
                if (mahallyName) return mahallyName;
                return v.display_name || v.first_name || v.username || null;
              };

              vendorsData.forEach(v => {
                const storeName = getStoreNameFromVendor(v);
                if (storeName) vendorMap[v.id] = storeName;
              });
            } catch (vendErr) {
              console.warn("Failed to fetch vendor profiles in reviews route:", vendErr.message);
            }
          }

          (productsRes.data || []).forEach(p => {
            const vendorIdFromMeta = p.meta_data?.find(m => m.key === "_vendor_id")?.value;
            const vendorIdFromStore = p.store?.id;
            const vendorId = parseInt(vendorIdFromMeta || vendorIdFromStore || p.author || 0);
            const vendorName = vendorMap[vendorId] || p.store?.name || p.store?.shop_name || "Mahally Partner";

            // Calculate default product commission configuration
            const perProductCommType = p.meta_data?.find(m => m.key === "_per_product_admin_commission_type")?.value;
            const perProductCommValue = p.meta_data?.find(m => m.key === "_per_product_admin_commission")?.value;
            const perProductAddFee = p.meta_data?.find(m => m.key === "_per_product_admin_additional_fee")?.value;

            const productPrice = parseFloat(p.price || p.regular_price || 0);
            let defaultCommissionValue = 1.00; // Default to Global Setting (Fixed JOD 1.00)
            let defaultCommissionLabel = "Commission (Fixed JOD 1.00)";

            const hasOverride = (perProductCommValue !== undefined && perProductCommValue !== null && perProductCommValue !== "") || 
                                (perProductAddFee !== undefined && perProductAddFee !== null && perProductAddFee !== "");

            if (perProductCommType && hasOverride) {
              const rate = parseFloat(perProductCommValue || 0);
              const fee = parseFloat(perProductAddFee || 0);
              if (perProductCommType === "percentage") {
                defaultCommissionValue = (rate / 100) * productPrice + fee;
                defaultCommissionLabel = `Commission (${rate}%)${fee > 0 ? ` + JOD ${fee.toFixed(2)}` : ""}`;
              } else if (perProductCommType === "fixed") {
                defaultCommissionValue = rate + fee;
                defaultCommissionLabel = `Commission (Fixed JOD ${defaultCommissionValue.toFixed(2)})`;
              }
            }

            productsMap[p.id] = {
              name: p.name,
              image: p.images?.[0]?.src || null,
              permalink: p.permalink,
              price: productPrice,
              merchant_id: vendorId || "",
              merchant_name: vendorName,
              commission_value: defaultCommissionValue,
              commission_label: defaultCommissionLabel
            };
          });

          // 3. Map everything to reviews
          reviews.forEach(r => {
            const prod = productsMap[r.product_id];
            if (prod) {
              r.product_name = prod.name;
              r.product_image = prod.image;
              r.product_permalink = prod.permalink;
              r.product_price = prod.price;
              r.merchant_id = prod.merchant_id;
              r.merchant_name = prod.merchant_name;
              r.commission_value = prod.commission_value;
              r.commission_label = prod.commission_label;
            }

            // Find matching order containing this product
            const matchingOrder = customerOrders.find(o => 
              o.line_items?.some(item => item.product_id === r.product_id)
            );

            if (matchingOrder) {
              const item = matchingOrder.line_items.find(item => item.product_id === r.product_id);
              r.order_id = matchingOrder.id;
              if (item) {
                r.product_price = item.price || item.subtotal || r.product_price || 0;
                
                // Check order line item metadata for merchant details
                const merchantIdMeta = item.meta_data?.find(m => ["merchant_id", "_vendor_id", "seller_id", "vendor_id"].includes(m.key))?.value;
                if (merchantIdMeta) {
                  r.merchant_id = merchantIdMeta;
                  if (vendorMap[merchantIdMeta]) {
                    r.merchant_name = vendorMap[merchantIdMeta];
                  }
                }

                const merchantNameMeta = item.meta_data?.find(m => ["merchant_name", "store_name", "vendor_name"].includes(m.key))?.value;
                if (merchantNameMeta && merchantNameMeta !== "Mahally Partner") {
                  r.merchant_name = merchantNameMeta;
                } else if (!r.merchant_name || r.merchant_name === "Mahally Partner") {
                  if (r.merchant_id && vendorMap[r.merchant_id]) {
                    r.merchant_name = vendorMap[r.merchant_id];
                  }
                }

                // Check order line item metadata for Dokan commission details
                const commType = item.meta_data?.find(m => m.key === "_dokan_commission_type")?.value;
                const commRate = item.meta_data?.find(m => m.key === "_dokan_commission_rate")?.value;
                const addFee = item.meta_data?.find(m => m.key === "_dokan_additional_fee")?.value;

                const itemPrice = parseFloat(r.product_price || 0);
                if (commType) {
                  const rate = parseFloat(commRate || 0);
                  const fee = parseFloat(addFee || 0);
                  if (commType === "percentage") {
                    r.commission_value = (rate / 100) * itemPrice + fee;
                    r.commission_label = `Commission (${rate}%)${fee > 0 ? ` + JOD ${fee.toFixed(2)}` : ""}`;
                  } else if (commType === "fixed") {
                    r.commission_value = rate + fee;
                    r.commission_label = `Commission (Fixed JOD ${r.commission_value.toFixed(2)})`;
                  } else if (commType === "combine") {
                    r.commission_value = (rate / 100) * itemPrice + fee;
                    r.commission_label = `Commission (Combine ${rate}% + JOD ${fee.toFixed(2)})`;
                  }
                }
              }
              r.delivery_fees = matchingOrder.shipping_total || "0.00";
            } else {
              r.order_id = "";
              r.delivery_fees = "0.00";
            }
          });
        } catch (enrichErr) {
          console.warn("Could not enrich reviews with details:", enrichErr.message);
        }
      }
    }

    const count = reviews.length;
    const avg = count > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1) 
      : "0.0";

    return NextResponse.json({ reviews, average_rating: avg, rating_count: count });
  } catch (error) {
    console.error("Reviews GET error:", error.response?.data || error.message);
    return NextResponse.json({ reviews: [], average_rating: "0.0", rating_count: 0 });
  }
}
