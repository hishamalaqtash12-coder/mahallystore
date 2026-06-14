import { NextResponse } from "next/server";
import { getCategories } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCategories({ 
      per_page: 100,
      hide_empty: false 
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
