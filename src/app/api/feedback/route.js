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

    // 3. Automatically dispatch Feedback email via Brevo API
    try {
      // The email address where feedback should be sent to
      const targetEmail = process.env.SMTP_USER || "info@mahallystore.com";
      const categoryList = Array.isArray(categories) ? categories.join(", ") : (categories || "N/A");

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #be374f; font-size: 20px; font-weight: bold; margin-bottom: 4px;">Mahally Customer Feedback</h2>
          <p style="color: #71717a; font-size: 13px; margin-top: 0;">New feedback submitted on platform</p>
          <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 16px 0;" />
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #71717a; width: 140px; font-weight: bold;">User Name:</td><td style="padding: 8px 0; color: #18181b;">${userName || 'Guest'}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">User Email:</td><td style="padding: 8px 0; color: #18181b;">${userEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">User Role:</td><td style="padding: 8px 0; color: #18181b;">${role || 'customer'}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">Rating:</td><td style="padding: 8px 0; color: #eab308; font-weight: bold;">${rating ? `${rating} / 5 Stars` : 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">Category:</td><td style="padding: 8px 0; color: #18181b;">${categoryList}</td></tr>
            ${specificIssue ? `<tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">Specific Issue:</td><td style="padding: 8px 0; color: #e11d48; font-weight: bold;">${specificIssue}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">Page Path:</td><td style="padding: 8px 0; color: #2563eb;">${routePath || '/'}</td></tr>
            <tr><td style="padding: 8px 0; color: #71717a; font-weight: bold;">Submitted At:</td><td style="padding: 8px 0; color: #18181b;">${new Date().toLocaleString()}</td></tr>
          </table>
          ${comment ? `<div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #be374f; border-radius: 4px;"><p style="margin: 0 0 6px 0; color: #475569; font-size: 12px; font-weight: bold;">User Comments:</p><p style="margin: 0; color: #0f172a; font-size: 14px; white-space: pre-wrap;">${comment}</p></div>` : ''}
        </div>`;

      const emailSubject = `NEW USER FEEDBACK: ${rating ? `Rating ${rating}/5` : 'General Feedback'} from ${userName || 'User'}`;

      // --- Send via Brevo API (HTTP) to bypass ISP port blocking ---
      if (process.env.BREVO_API_KEY) {
        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY.replace(/^"|"$/g, ''), // Strip quotes if any
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            sender: { name: "Mahally Feedback", email: "info@mahallystore.com" },
            to: [{ email: targetEmail }],
            subject: emailSubject,
            htmlContent: htmlBody,
          }),
        });
        
        if (brevoRes.ok) {
          console.log("✅ Feedback email sent successfully via API to:", targetEmail);
        } else {
          const errText = await brevoRes.text();
          console.warn("⚠️ Brevo API failed:", brevoRes.status, errText);
        }
      } else {
        console.warn("⚠️ No BREVO_API_KEY found in .env, email not sent.");
      }
    } catch (emailErr) {
      console.warn("Could not dispatch feedback notification email:", emailErr.message);
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

