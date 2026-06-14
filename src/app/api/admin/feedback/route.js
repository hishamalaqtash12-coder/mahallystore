import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const FEEDBACK_FILE_PATH = path.join(process.cwd(), "src/data/feedback.json");

export async function GET(request) {
  try {
    let globalLog = [];
    try {
      const fileContent = await fs.readFile(FEEDBACK_FILE_PATH, "utf8");
      globalLog = JSON.parse(fileContent);
    } catch (e) {
      // file doesn't exist
    }

    return NextResponse.json({ feedback: globalLog });
  } catch (error) {
    console.error("Admin Feedback GET error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { feedbackDate } = await request.json();
    if (!feedbackDate) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    let globalLog = [];
    try {
      const fileContent = await fs.readFile(FEEDBACK_FILE_PATH, "utf8");
      globalLog = JSON.parse(fileContent);
    } catch (e) {
      return NextResponse.json({ error: "No feedback found" }, { status: 404 });
    }
    
    // Filter out the feedback with matching date
    const updatedLog = globalLog.filter(f => f.date !== feedbackDate);

    await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(updatedLog, null, 2), "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Feedback DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
