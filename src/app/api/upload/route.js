import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

/**
 * POST /api/upload
 * FormData: { file, type: "avatar" | "logo" | "banner" | "misc" }
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "misc"; // avatar, logo, banner, etc.

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    
    let subfolder = "misc";
    if (type === "avatar") subfolder = "avatars";
    if (type === "logo") subfolder = "vendors/logos";
    if (type === "banner") subfolder = "vendors/covers";

    const relativePath = `/uploads/${subfolder}/${filename}`;
    const absolutePath = path.join(process.cwd(), "public", "uploads", subfolder, filename);

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
