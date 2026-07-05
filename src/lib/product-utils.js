/**
 * Shared product utilities that can be used in both Server and Client components.
 */

export function isProductOutOfStock(product) {
  if (!product) return true;
  if (product.stock_status === "outofstock") return true;
  if (product.manage_stock && product.stock_quantity !== null && parseInt(product.stock_quantity) <= 0) return true;
  return false;
}

export function getProductMerchant(product) {
  if (!product) return { name: null, id: null, slug: null };
  const name =
    product.store?.shop_name ||
    product.store?.name ||
    product.meta_data?.find(m => m.key === "merchant_name")?.value ||
    product.meta_data?.find(m => m.key === "mahally_owner_name")?.value ||
    null;
  const id =
    product.meta_data?.find(m => m.key === "_vendor_id")?.value ||
    product.meta_data?.find(m => m.key === "mahally_owner_id")?.value ||
    product.store?.id ||
    product.author ||
    null;
  
  let slug = null;
  if (product.store?.url) {
    const parts = product.store.url.replace(/\/$/, '').split('/');
    slug = parts[parts.length - 1];
  }
  
  return { name, id, slug };
}
