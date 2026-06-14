import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SETTINGS_PATH = path.join(process.cwd(), "src/data/settings.json");

export async function GET() {
  try {
    const fileContent = await fs.readFile(SETTINGS_PATH, "utf8");
    const settings = JSON.parse(fileContent);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Public Settings GET error:", error);
    return NextResponse.json({ 
      messagingEnabled: true, 
      whatsappEnabled: true,
      supportEmail: "support@mahally.jo"
    });
  }
}
