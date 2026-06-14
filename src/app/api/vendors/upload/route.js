import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

/**
 * POST /api/vendors/upload
 * FormData: { file, type: "banner" | "logo" }
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type"); // banner or logo

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const subfolder = type === "banner" ? "covers" : "logos";
    const relativePath = `/uploads/vendors/${subfolder}/${filename}`;
    const absolutePath = path.join(process.cwd(), "public", "uploads", "vendors", subfolder, filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    
    // Write file
    await fs.writeFile(absolutePath, buffer);

    return NextResponse.json({ success: true, url: relativePath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
