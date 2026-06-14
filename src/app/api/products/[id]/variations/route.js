import { getProductVariations } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id } = await params;
  
  try {
    const variations = await getProductVariations(id);
    return NextResponse.json(variations || []);
  } catch (error) {
    console.error("Error fetching variations API:", error);
    return NextResponse.json([], { status: 500 });
  }
}
