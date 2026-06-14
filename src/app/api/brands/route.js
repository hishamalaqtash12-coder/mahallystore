import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempting to fetch from 'products/brands' which is the standard endpoint for most WC Brand plugins
    const response = await wcApi.get("products/brands", { per_page: 100, orderby: 'name', order: 'asc' });
    return NextResponse.json(response.data);
  } catch (error) {
    console.warn("API Brands error (might not be supported by current plugins):", error.message);
    // Return empty array instead of 500 so the UI doesn't break if the plugin isn't active
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    const response = await wcApi.post("products/brands", { name });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Create Brand error:", error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || "Failed to create brand" 
    }, { status: 500 });
  }
}
