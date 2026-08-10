import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { wooId, updates } = await request.json();

    if (!wooId) {
      return NextResponse.json({ error: "WooCommerce ID is required" }, { status: 400 });
    }

    const { data: updatedCustomer } = await wcApi.put(`customers/${wooId}`, updates);
    
    if (!updatedCustomer || updatedCustomer.code) {
      throw new Error(updatedCustomer?.message || "Failed to update profile via REST API");
    }

    return NextResponse.json({ 
      success: true, 
      customer: {
        id: updatedCustomer.id,
        displayName: `${updatedCustomer.first_name} ${updatedCustomer.last_name}`.trim(),
        email: updatedCustomer.email,
        phoneNumber: updatedCustomer.billing?.phone || ""
      }
    });
  } catch (error) {
    console.error("Profile update API error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
