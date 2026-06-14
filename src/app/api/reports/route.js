import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "src/data/settings.json");
const REPORTS_PATH = path.join(process.cwd(), "src/data/reports.json");

// Helper to load settings
async function getSettings() {
  try {
    const fileContent = await fs.readFile(SETTINGS_PATH, "utf8");
    return JSON.parse(fileContent);
  } catch (e) {
    return { reportingEnabled: false };
  }
}

// Helper to load reports
async function getReports() {
  try {
    const fileContent = await fs.readFile(REPORTS_PATH, "utf8");
    return JSON.parse(fileContent);
  } catch (e) {
    return [];
  }
}

// POST: Submit a new user report
export async function POST(request) {
  try {
    const settings = await getSettings();
    
    // Check if the system is enabled
    if (!settings.reportingEnabled) {
      return NextResponse.json(
        { success: false, error: "The user reporting system is currently disabled." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reporterId, reportedId, reason, details } = body;

    // Validate inputs
    if (!reportedId || !reason || !details) {
      return NextResponse.json(
        { success: false, error: "reportedId, reason, and details are required parameters." },
        { status: 400 }
      );
    }

    const reports = await getReports();

    const newReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      reporterId: reporterId || "anonymous",
      reportedId,
      reason, // e.g., "spam", "fraud", "harassment", "inappropriate", "other"
      details,
      timestamp: new Date().toISOString(),
      status: "pending" // "pending" | "reviewed" | "dismissed"
    };

    reports.push(newReport);

    // Save to file database
    await fs.writeFile(REPORTS_PATH, JSON.stringify(reports, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully. Thank you for keeping our marketplace safe.",
      report: newReport
    });
  } catch (error) {
    console.error("Submit report error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while submitting your report." },
      { status: 500 }
    );
  }
}

// GET: List all reports (For Admin review)
export async function GET() {
  try {
    const reports = await getReports();
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("List reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load reports." },
      { status: 500 }
    );
  }
}
