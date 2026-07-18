import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONTACT_MESSAGES_FILE = path.join(process.cwd(), "src/data/contact_messages.json");

export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const newMessage = {
      id: Date.now(),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString()
    };

    // 1. Save to local JSON file for record keeping
    try {
      let messages = [];
      try {
        const fileContent = await fs.readFile(CONTACT_MESSAGES_FILE, "utf8");
        messages = JSON.parse(fileContent);
      } catch (e) {
        // file doesn't exist
      }
      messages.unshift(newMessage);
      if (messages.length > 500) messages = messages.slice(0, 500);

      await fs.mkdir(path.dirname(CONTACT_MESSAGES_FILE), { recursive: true });
      await fs.writeFile(CONTACT_MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
    } catch (fsErr) {
      console.error("Failed to save contact message locally:", fsErr.message);
    }

    // 2. Send email via Resend if API key is set
    if (process.env.RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: "info@mahallystore.com",
            subject: `Contact Us Submission: ${subject}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                <h2 style="color: #be374f;">New Contact Message Received</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p style="white-space: pre-wrap;"><strong>Message:</strong><br/>${message}</p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errData = await emailResponse.json().catch(() => ({}));
          console.warn("Resend email dispatch failed:", errData);
        } else {
          console.log("Contact form email notification sent successfully via Resend.");
        }
      } catch (emailErr) {
        console.warn("Could not dispatch email notification:", emailErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
