import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";
import { wcApi, clearProductsCache } from "@/lib/woocommerce";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const dynamic = 'force-dynamic';

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://fallback.mahally.local',
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: "wc/v3"
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wooId = searchParams.get("wooId") || searchParams.get("vendorId");

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    let products = [];
    let trustedSource = false; // If Dokan returned products, they're already vendor-scoped
    
    try {
      // 1. Primary Attempt: Dokan REST API (Provides vendor-specific formatting)
      products = await dokanApi.getProducts(wooId);
      
      // Dokan can return an error object instead of array if permissions fail
      if (products && !Array.isArray(products) && products.code) {
        throw new Error(products.message || "Dokan API Error");
      }

      if (Array.isArray(products) && products.length > 0) {
        trustedSource = true; // Dokan already filters by vendor_id
        console.log(`[Merchant Products] Dokan returned ${products.length} products for vendor ${wooId}`);
      }
    } catch (dokanError) {
      console.warn("[Merchant Products] Dokan API listing failed:", dokanError.message);
    }

    // 2. Secondary Attempt: WooCommerce REST API with author-based lookup
    if (!Array.isArray(products) || products.length === 0) {
      try {
        const authorId = Number(wooId);
        const res = await api.get("products", {
          author: authorId,
          per_page: 100,
          status: "any"
        });
        const authorProducts = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

        if (authorProducts.length > 0) {
          products = authorProducts;
          trustedSource = true;
          console.log(`[Merchant Products] WC REST (author) returned ${products.length} products for vendor ${wooId}`);
        } else {
          console.log(`[Merchant Products] Trying last resort: fetch all and filter locally for vendor ${wooId}`);
          const allRes = await api.get("products", { per_page: 100, status: "any" });
          const allProducts = Array.isArray(allRes?.data) ? allRes.data : Array.isArray(allRes) ? allRes : [];
          if (allProducts.length > 0) {
            products = allProducts.filter((p) => {
              const authorMatch = String(p.author || p.post_author || "") === String(wooId);
              const metaMatch = (p.meta_data || []).some((m) =>
                (m.key === "_dokan_vendor_id" || m.key === "mahally_owner_id" || m.key === "_vendor_id" || m.key === "merchant_id") &&
                String(m.value) === String(wooId)
              );
              const vendorMatch = String(p.store?.id || p.vendor?.id || "") === String(wooId);
              return authorMatch || metaMatch || vendorMatch;
            });
            console.log(`[Merchant Products] Local filter found ${products.length} products for vendor ${wooId}`);
          }
        }
      } catch (wcError) {
        console.error("[Merchant Products] WooCommerce REST fallback failed:", wcError.message);
      }
    }


    // Normalize stock_status to WooCommerce standard values.
    // Dokan can return null, "In Stock", "in_stock", etc.
    // WooCommerce's own default is 'instock', so we use that when the value is missing.
    const normalizeStockStatus = (status, manageStock, stockQty) => {
      if (status) {
        const s = status.toLowerCase().replace(/[\s_]/g, '');
        if (s === 'instock') return 'instock';
        if (s === 'onbackorder') return 'onbackorder';
        if (s === 'outofstock') return 'outofstock';
      }
      // Infer from quantity when stock is managed
      if (manageStock && stockQty !== null && stockQty !== undefined) {
        return stockQty > 0 ? 'instock' : 'outofstock';
      }
      return 'instock'; // WooCommerce default
    };

    const enrichedProducts = await Promise.all((Array.isArray(products) ? products : []).map(async (p) => {
      return {
        ...p,
        stock_status: normalizeStockStatus(p.stock_status, p.manage_stock, p.stock_quantity),
        brands: p.brands || p.product_brand || []
      };
    }));

    // 5. STRICT DATA ISOLATION: Always apply local filter.
    // WooCommerce REST API 'products' endpoint ignores 'author' and returns ALL products!
    // We MUST filter locally to guarantee vendors only see their own products.
    let finalProducts = enrichedProducts.filter(p => {
      const authorId = String(p.author || p.post_author || "");
      const vendorId = String(p.store?.id || p.vendor?.id || "");
      const metaVendorId = p.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      
      return authorId === String(wooId) || 
             vendorId === String(wooId) || 
             String(metaVendorId) === String(wooId);
    });

    // 6. Supplement brands + tags from WC REST API in a single batch request.
    // Dokan's product list response doesn't include 'brands' (plugin field) and
    // may omit 'tags'. One bulk call fetching by product IDs fills in those gaps.
    if (finalProducts.length > 0) {
      try {
        const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, "");
        const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
        const ids = finalProducts.map(p => p.id).join(",");
        const wcRes = await fetch(
          `${WP_URL}/wp-json/wc/v3/products?include=${ids}&per_page=${finalProducts.length}&status=any`,
          { headers: { Authorization: `Basic ${auth}` } }
        );
        if (wcRes.ok) {
          const wcProducts = await wcRes.json();
          if (Array.isArray(wcProducts)) {
            const wcMap = {};
            wcProducts.forEach(p => { wcMap[p.id] = p; });
            finalProducts = finalProducts.map(p => {
              const wc = wcMap[p.id];
              if (!wc) return p;
              return {
                ...p,
                // Always prefer WC REST API brands (authoritative source)
                brands: (wc.brands?.length > 0 ? wc.brands : p.brands) || [],
                // Supplement tags only if Dokan didn't return them
                tags: (p.tags?.length > 0 ? p.tags : wc.tags) || []
              };
            });
          }
        }
      } catch (supplementErr) {
        console.warn("[Merchant Products] Brands/tags supplement failed (non-fatal):", supplementErr.message);
      }
    }

    console.log(`[Merchant Products] Returning ${finalProducts.length} products for vendor ${wooId}`);
    return NextResponse.json(finalProducts);

  } catch (error) {
    console.error("Merchant products fetch error:", error);
    // Return empty array instead of 500 to keep the dashboard usable
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { product, variations, wooId } = body;
    
    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor identification (wooId)" }, { status: 400 });
    }

    // 1. Create the parent product using WC API (More reliable for forcing author with Admin keys)
    const allImages = product.images || [];
    const mainImageId = allImages[0] ? parseInt(allImages[0].id) : null;

    // Sanitize product object to remove readonly or problematic fields
    const { type, images, date_created, date_modified, ...safeProductData } = product;

    const productPayload = {
      ...safeProductData,
      featured_image: mainImageId, // Some Dokan versions expect raw ID
      image_id: mainImageId,       // Alternative Dokan field
      images: allImages.filter(img => img.id).map(img => ({ id: parseInt(img.id) })), // Standard gallery format
      status: 'pending', 
      author: parseInt(wooId),
      post_author: parseInt(wooId),
      vendor_id: parseInt(wooId),
      regular_price: product.regular_price?.toString(),
      sale_price: product.sale_price?.toString(),
      meta_data: [
        ...(product.meta_data || []),
        { key: '_dokan_vendor_id', value: String(wooId) },
        { key: 'mahally_owner_id', value: String(wooId) },
        { key: '_vendor_id', value: String(wooId) },
        { key: '_thumbnail_id', value: String(mainImageId) } // Fallback for featured image
      ]
    };

    // 0.5 Enforce single featured product per merchant limit
    if (product.featured === true) {
      try {
        const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
        const prodRes = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products?author=${wooId}&per_page=100&status=any&featured=true`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        const vendorProducts = await prodRes.json();
        
        if (Array.isArray(vendorProducts)) {
          // Use direct WC REST API — wcApi.put routes through GraphQL which doesn't support 'featured'
          await Promise.all(vendorProducts.map(async (p) => {
            try {
              await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products/${p.id}`, {
                method: 'PUT',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ featured: false })
              });
            } catch (updateErr) {
              console.warn(`Failed to un-feature product ${p.id}:`, updateErr.message);
            }
          }));
        }
      } catch (err) {
        console.warn("Failed to un-feature previous products:", err.message);
      }
    }

    // Use Dokan API instead of WC API to ensure authorship is correctly assigned to the vendor
    const createdProduct = await dokanApi.createProduct(productPayload, wooId);

    // 1.5 Double-check update with standard WooCommerce API for price fields and images
    // Dokan REST API can sometimes be flaky with price/image updates on specific server configs.
    if (createdProduct.id) {
      try {
        await api.put(`products/${createdProduct.id}`, {
          regular_price: product.regular_price?.toString(),
          sale_price: product.sale_price?.toString(),
          date_on_sale_from: product.date_on_sale_from || null,
          date_on_sale_to: product.date_on_sale_to || null,
          brands: product.brands,
          product_brand: (product.brands || []).map(b => b.id),
          images: allImages.filter(img => img.id).map(img => ({ id: parseInt(img.id) }))
        });
      } catch (wcPriceError) {
        console.warn("Direct WC creation update failed:", wcPriceError.message);
      }
    }

    // 2. If it's a variable product and has variations, create them
    // Note: variations are still created via wcApi as Dokan proxy is primarily for parent product authorship
    if (createdProduct.type === 'variable' && variations && variations.length > 0) {
      try {
        // Prepare variations for WooCommerce format
        const variationPayload = variations.map(v => ({
          regular_price: String(v.regular_price || ""),
          sale_price: String(v.sale_price || ""),
          sku: v.sku || "",
          manage_stock: v.manage_stock || false,
          stock_quantity: parseInt(v.stock_quantity || 0),
          low_stock_amount: v.low_stock_amount ? parseInt(v.low_stock_amount) : null,
          backorders: v.backorders || "no",
          weight: v.weight || "",
          dimensions: v.dimensions || {},
          shipping_class: v.shipping_class || "",
          image: v.image?.id ? { id: v.image.id } : (v.image?.src ? { src: v.image.src } : null),
          attributes: v.attributes.map(a => ({
            id: a.id || 0,
            name: a.name,
            option: a.option
          }))
        }));

        await wcApi.post(`products/${createdProduct.id}/variations/batch`, {
          create: variationPayload
        });
      } catch (varError) {
        console.error("Variations creation failed:", varError.response?.data || varError.message);
        // We don't fail the whole request since the parent product is created
      }
    }

    clearProductsCache();
    return NextResponse.json(createdProduct);
  } catch (error) {
    console.error("Product creation error:", error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data?.message || error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, product, variations, wooId } = await req.json();

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");

    // 0. OWNERSHIP CHECK: Ensure the merchant owns this product
    try {
      const current = await api.get(`products/${id}`);
      const authorId = String(current.data.author || current.data.post_author || "");
      const metaVendorId = current.data.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      
      if (authorId !== String(wooId) && String(metaVendorId) !== String(wooId)) {
        return NextResponse.json({ error: "Unauthorized: You do not own this product" }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }

    // 0.5 Enforce single featured product per merchant limit
    if (product.featured === true) {
      try {
        const prodRes = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products?author=${wooId}&per_page=100&status=any&featured=true`, {
          headers: { Authorization: `Basic ${auth}` }
        });
        const vendorProducts = await prodRes.json();
        
        if (Array.isArray(vendorProducts)) {
          // Use direct WC REST API — wcApi.put routes through GraphQL which doesn't support 'featured'
          await Promise.all(vendorProducts
            .filter(p => String(p.id) !== String(id)) // Skip the product being featured
            .map(async (p) => {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/products/${p.id}`, {
                  method: 'PUT',
                  headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ featured: false })
                });
              } catch (updateErr) {
                console.warn(`Failed to un-feature product ${p.id}:`, updateErr.message);
              }
            })
          );
        }
      } catch (err) {
        console.warn("Failed to un-feature previous products:", err.message);
      }
    }

    // Detect a featured-only (quick toggle) update — the star button sends ONLY { featured: bool }.
    // Calling dokanApi.updateProduct with no images would clear the product gallery.
    // Use a direct WC REST API PATCH instead so only the 'featured' field is touched.
    const productKeys = Object.keys(product);
    const isFeaturedOnlyToggle = productKeys.length === 1 && productKeys[0] === 'featured';
    const isStatusOnlyToggle = productKeys.length === 1 && productKeys[0] === 'status';

    if (isFeaturedOnlyToggle || isStatusOnlyToggle) {
      const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, "");
      const auth = Buffer.from(`${process.env.WP_ADMIN_USER || process.env.WC_CONSUMER_KEY}:${process.env.WP_ADMIN_APP_PASS || process.env.WC_CONSUMER_SECRET}`).toString("base64");
      
      const wcRes = await fetch(`${WP_URL}/wp-json/wc/v3/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isFeaturedOnlyToggle ? { featured: product.featured } : { status: product.status })
      });
      if (!wcRes.ok) {
        throw new Error(`WC REST update failed: ${wcRes.status}`);
      }
      const updatedProduct = await wcRes.json();
      // Clear the GraphQL cache so homepage/product-listing reflects the new status immediately
      clearProductsCache();
      return NextResponse.json(updatedProduct);
    }

    // Full product update (from the edit form) — safe to call Dokan with full payload
    const allImages = product.images || [];
    const mainImageId = allImages[0] && allImages[0].id ? parseInt(allImages[0].id) : null;

    // Sanitize product object to remove readonly or problematic fields
    const { type, images, date_created, date_modified, ...safeProductData } = product;

    // Use Dokan API instead of WC API to ensure authorship is correctly assigned to the vendor
    const updatedProduct = await dokanApi.updateProduct(id, {
      ...safeProductData,
      featured_image: mainImageId,
      image_id: mainImageId,
      images: allImages.filter(img => img.id).map(img => ({ id: parseInt(img.id) })),
      author: parseInt(wooId),
      post_author: parseInt(wooId),
      vendor_id: parseInt(wooId),
      regular_price: product.regular_price?.toString(),
      sale_price: product.sale_price?.toString(),
      meta_data: [
        ...(product.meta_data || []),
        { key: '_dokan_vendor_id', value: String(wooId) },
        { key: 'mahally_owner_id', value: String(wooId) },
        { key: '_vendor_id', value: String(wooId) },
        { key: '_thumbnail_id', value: String(mainImageId) }
      ]
    }, wooId);
    
    // 1.5 Double-check update with standard WooCommerce API for price fields and images
    // Dokan REST API can sometimes be flaky with price/image updates on specific server configs.
    // Since we are using Admin keys for wcApi, this ensures the database is updated properly.
    try {
      await api.put(`products/${id}`, {
        regular_price: product.regular_price?.toString(),
        sale_price: product.sale_price?.toString(),
        date_on_sale_from: product.date_on_sale_from || null,
        date_on_sale_to: product.date_on_sale_to || null,
        brands: product.brands,
        product_brand: (product.brands || []).map(b => b.id),
        images: allImages.filter(img => img.id).map(img => ({ id: parseInt(img.id) }))
      });
    } catch (wcPriceError) {
      console.warn("Direct WC update failed, but Dokan update proceeded:", wcPriceError.message);
    }

    // 2. Handle variations if it's a variable product
    if (updatedProduct.type === 'variable' && variations && variations.length > 0) {
      try {
        const variationPayload = variations.map(v => ({
          id: v.id, // Include ID for updates
          regular_price: String(v.regular_price || ""),
          sale_price: String(v.sale_price || ""),
          sku: v.sku || "",
          manage_stock: v.manage_stock || false,
          stock_quantity: parseInt(v.stock_quantity || 0),
          low_stock_amount: v.low_stock_amount ? parseInt(v.low_stock_amount) : null,
          backorders: v.backorders || "no",
          weight: v.weight || "",
          dimensions: v.dimensions || {},
          shipping_class: v.shipping_class || "",
          image: v.image?.id ? { id: v.image.id } : (v.image?.src ? { src: v.image.src } : null),
          attributes: v.attributes.map(a => ({
            id: a.id || 0,
            name: a.name,
            option: a.option
          }))
        }));

        // Use batch to update existing and create new ones (WooCommerce handles this via 'update' and 'create' keys)
        // For simplicity here, we split them or just use update if they have IDs
        const toUpdate = variationPayload.filter(v => v.id);
        const toCreate = variationPayload.filter(v => !v.id);

        await api.post(`products/${id}/variations/batch`, {
          update: toUpdate,
          create: toCreate
        });
      } catch (varError) {
        console.error("Variations update failed:", varError.response?.data || varError.message);
      }
    }

    clearProductsCache();
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Product update error:", error.response?.data || error.message);
    return NextResponse.json({ error: error.response?.data?.message || error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id, ids, wooId } = await req.json();

    if (!wooId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    const shouldForceDelete = async (productId) => {
      try {
        const productRes = await api.get(`products/${productId}`);
        return productRes.data.status === 'trash';
      } catch (e) {
        return false;
      }
    };

    const verifyOwnership = async (productId) => {
      try {
        const current = await api.get(`products/${productId}`);
        const authorId = String(current.data.author || current.data.post_author || "");
        const metaVendorId = current.data.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
        return authorId === String(wooId) || String(metaVendorId) === String(wooId);
      } catch (e) {
        return false;
      }
    };

    if (ids && Array.isArray(ids)) {
      const deletePromises = ids.map(async (productId) => {
        if (!(await verifyOwnership(productId))) return null;
        const force = await shouldForceDelete(productId);
        return dokanApi.fetch(`products/${productId}?force=${force}`, { method: 'DELETE' });
      });
      const results = await Promise.all(deletePromises);
      clearProductsCache();
      return NextResponse.json({ success: true, deleted: results.filter(r => r !== null).length });
    }

    if (!(await verifyOwnership(id))) {
      return NextResponse.json({ error: "Unauthorized: You do not own this product" }, { status: 403 });
    }
    const force = await shouldForceDelete(id);
    const res = await dokanApi.fetch(`products/${id}?force=${force}`, { method: 'DELETE' });
    clearProductsCache();
    return NextResponse.json(res);
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
