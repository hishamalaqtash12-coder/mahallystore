import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "src/data/featured-vendors.json");

function readData() {
  try {
    if (existsSync(DATA_FILE)) {
      return JSON.parse(readFileSync(DATA_FILE, "utf8"));
    }
  } catch {}
  return { featuredIds: [] };
}

/** GET /api/admin/featured-vendors */
export async function GET() {
  return NextResponse.json(readData());
}

/** POST /api/admin/featured-vendors — save selected vendor IDs */
export async function POST(request) {
  try {
    const body = await request.json();
    const featuredIds = Array.isArray(body.featuredIds) ? body.featuredIds.map(Number) : [];
    const data = { featuredIds };
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Featured vendors save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
