import { getCategories, wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

let categoriesCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (categoriesCache && (now - lastFetchTime < CACHE_DURATION)) {
      return NextResponse.json(categoriesCache);
    }

    const categories = await getCategories({ 
      hide_empty: false,
      per_page: 100,
      orderby: 'name',
      order: 'asc'
    });

    categoriesCache = categories;
    lastFetchTime = now;

    return NextResponse.json(categories);
  } catch (error) {
    console.error("API Categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, parent = 0 } = await req.json();
    const response = await wcApi.post("products/categories", { name, parent });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Create Category error:", error.response?.data || error.message);
    return NextResponse.json({ 
      error: error.response?.data?.message || "Failed to create category" 
    }, { status: 500 });
  }
}
