import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function PATCH(request) {
  try {
    const { id, stock_quantity, wooId } = await request.json();

    if (!id || stock_quantity === undefined || !wooId) {
      return NextResponse.json({ error: "Missing product ID, stock quantity, or vendor ID" }, { status: 400 });
    }

    // OWNERSHIP CHECK: Ensure the merchant owns this product
    try {
      const current = await wcApi.get(`products/${id}`);
      const authorId = String(current.data.author || current.data.post_author || "");
      const metaVendorId = current.data.meta_data?.find(m => m.key === '_dokan_vendor_id' || m.key === 'mahally_owner_id' || m.key === '_vendor_id' || m.key === 'merchant_id')?.value;
      
      if (authorId !== String(wooId) && String(metaVendorId) !== String(wooId)) {
        return NextResponse.json({ error: "Unauthorized: You do not own this product" }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 });
    }

    const newQuantity = parseInt(stock_quantity, 10) || 0;
    const res = await wcApi.put(`products/${id}`, {
      manage_stock: true,
      stock_quantity: newQuantity,
      stock_status: newQuantity > 0 ? 'instock' : 'outofstock'
    });

    if (!res?.data || res?.data?.code) {
      throw new Error(res?.data?.message || "Failed to update product stock");
    }

    return NextResponse.json(res.data);
  } catch (error) {
    console.error("Quick stock update error:", error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
