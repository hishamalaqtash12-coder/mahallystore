import { updateCustomerMeta } from "@/lib/woocommerce";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const FEEDBACK_FILE_PATH = path.join(process.cwd(), "src/data/feedback.json");

export async function POST(request) {
  try {
    const { wooId, userName, userEmail, role, rating, categories, specificIssue, comment, path: routePath, avatarUrl, avatarBgColor } = await request.json();

    if (!wooId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const newFeedback = {
      userId: wooId,
      userName: userName || 'Guest',
      userEmail: userEmail || '',
      role: role || 'customer',
      date: new Date().toISOString(),
      rating,
      categories,
      specificIssue,
      comment,
      path: routePath,
      avatarUrl: avatarUrl || '',
      avatarBgColor: avatarBgColor || ''
    };

    // 1. Update latest feedback for the specific user (Overwrite) - catch error to prevent failure
    if (wooId && Number(wooId) !== 999) {
      try {
        await updateCustomerMeta(wooId, {
          mahally_latest_feedback: JSON.stringify(newFeedback)
        });
      } catch (userErr) {
        console.warn(`Failed to update latest feedback for user ${wooId}:`, userErr.message);
      }
    }

    // 2. Append to Global Feedback Log (Persistent JSON)
    try {
      let globalLog = [];
      try {
        const fileContent = await fs.readFile(FEEDBACK_FILE_PATH, "utf8");
        globalLog = JSON.parse(fileContent);
      } catch (e) {
        // file doesn't exist yet
      }

      // Add to global log, keeping it unique by user (excluding guests)
      const userIndex = globalLog.findIndex(f => f.userId === wooId && Number(f.userId) !== 999);
      if (userIndex > -1 && Number(wooId) !== 999) {
        globalLog[userIndex] = newFeedback; // Update existing
      } else {
        globalLog.unshift(newFeedback); // Add new to top
      }

      if (globalLog.length > 500) globalLog = globalLog.slice(0, 500);

      // Ensure directory exists
      await fs.mkdir(path.dirname(FEEDBACK_FILE_PATH), { recursive: true });
      await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(globalLog, null, 2), "utf8");
    } catch (fsErr) {
      console.error("Global log file write failed:", fsErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}

export async function GET() {
  try {
    let globalLog = [];
    try {
      const fileContent = await fs.readFile(FEEDBACK_FILE_PATH, "utf8");
      globalLog = JSON.parse(fileContent);
    } catch (e) {
      // file doesn't exist
    }
    return NextResponse.json(globalLog);
  } catch (error) {
    console.error("Fetch feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

