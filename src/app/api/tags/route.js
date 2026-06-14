import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await wcApi.get("products/tags", { per_page: 100, orderby: 'count', order: 'desc' });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("API Tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name } = await req.json();
    const response = await wcApi.post("products/tags", { name });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Create Tag error:", error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || "Failed to create tag" 
    }, { status: 500 });
  }
}
