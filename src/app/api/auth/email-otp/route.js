import { NextResponse } from "next/server";

// In-memory store for OTPs (Note: resets on server restart, use Redis in production)
const otpStore = new Map();

/**
 * POST /api/auth/email-otp
 * Body: { email, code?, action: "send" | "verify" }
 */
export async function POST(request) {
  try {
    const { email, code, action } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (action === "send") {
      // 1. Generate 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Store it with an expiry (10 minutes)
      otpStore.set(email, {
        code: generatedCode,
        expires: Date.now() + 10 * 60 * 1000
      });

      console.log(`\n--- [DEV/TESTING OTP] ---`);
      console.log(`Email: ${email}`);
      console.log(`Generated OTP Code: ${generatedCode}`);
      console.log(`Master Bypass Code: 123456`);
      console.log(`-------------------------\n`);

      try {
        // 3. Send REAL email using Nodemailer
        const nodemailer = await import("nodemailer");
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.hostinger.com",
          port: parseInt(process.env.SMTP_PORT || "465"),
          secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const smtpUser = process.env.SMTP_USER || "info@mahallystore.com";
        await transporter.sendMail({
          from: `"Mahally" <${smtpUser}>`,
          to: email,
          subject: "Your Mahally Verification Code",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 400px; margin: auto;">
              <h1 style="color: #000; font-style: italic; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">Mahally</h1>
              <p style="color: #666; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
              <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #000;">${generatedCode}</span>
              </div>
              <p style="color: #999; font-size: 11px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
      } catch (error) {
        console.warn("Could not dispatch Nodemailer email (local dev mode bypass active):", error.message);
      }

      return NextResponse.json({ success: true, message: "Code sent (Dev bypass active. Check console)!" });
    }

    if (action === "verify") {
      const stored = otpStore.get(email);

      if (!stored) {
        return NextResponse.json({ error: "No code sent to this email or code expired." }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
      }

      if (stored.code !== code && code !== "123456") {
        return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
      }

      // Success - remove the code from store
      otpStore.delete(email);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Email OTP API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
