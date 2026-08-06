import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { resetAdminIdCache } from "@/lib/messages";

const SETTINGS_PATH = path.join(process.cwd(), "src/data/settings.json");

export async function GET() {
  try {
    const fileContent = await fs.readFile(SETTINGS_PATH, "utf8");
    const settings = JSON.parse(fileContent);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ 
      messagingEnabled: true,
      whatsappEnabled: true,
      advertisingEnabled: true,
      reportingEnabled: false,
      promoVideoTitle: "Mahally Platform",
      supportEmail: "support@mahally.jo",
      supportUserId: null,
      supportUserName: ""
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const newSettings = {
      promoVideoUrl: body.promoVideoUrl || "",
      promoVideoThumbnail: body.promoVideoThumbnail || "",
      promoVideoTitle: body.promoVideoTitle || "",
      promoVideoDescription: body.promoVideoDescription || "",
      messagingEnabled: body.messagingEnabled !== false,
      whatsappEnabled: body.whatsappEnabled !== false,
      advertisingEnabled: body.advertisingEnabled !== false,
      reportingEnabled: body.reportingEnabled === true,
      supportEmail: body.supportEmail || "support@mahally.jo",
      supportUserId: body.supportUserId ? Number(body.supportUserId) : null,
      supportUserName: body.supportUserName || "",
      socialFacebook: body.socialFacebook || "",
      socialInstagram: body.socialInstagram || "",
      socialTwitter: body.socialTwitter || "",
      socialTikTok: body.socialTikTok || ""
    };

    await fs.writeFile(SETTINGS_PATH, JSON.stringify(newSettings, null, 2), "utf8");
    // Invalidate the getAdminId() cache so new support user takes effect immediately
    resetAdminIdCache();
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
