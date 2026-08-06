import { wcApi } from "@/lib/woocommerce";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users?search=<query>&role=<role>
 * Returns a list of admin/editor/shop_manager users for the support agent picker.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "administrator";

    const params = { per_page: 20, role };
    if (search) params.search = search;

    const res = await wcApi.get("customers", params);
    const users = res.data || [];

    const mapped = users.map((u) => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim() || u.username,
      email: u.email,
      username: u.username,
      avatar: u.avatar_url || null,
    }));

    return NextResponse.json({ users: mapped });
  } catch (error) {
    console.error("Admin users API error:", error.message);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
