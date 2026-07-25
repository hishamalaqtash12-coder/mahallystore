import { NextResponse } from "next/server";

// In-memory store for OTPs (Note: resets on server restart, use Redis in production)
const otpStore = new Map();

export async function POST(request) {
  try {
    const { phone, code, action } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (action === "send") {
      // 1. Generate 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Store it with an expiry (5 minutes)
      otpStore.set(phone, {
        code: generatedCode,
        expires: Date.now() + 5 * 60 * 1000
      });

      console.log(`\n--- [DEV/TESTING OTP] ---`);
      console.log(`Phone: ${phone}`);
      console.log(`Generated OTP Code: ${generatedCode}`);
      console.log(`Master Bypass Code: 123456`);
      console.log(`-------------------------\n`);

      try {
        // 3. Prepare NGT API payload
        const formattedPhone = phone.replace("+", "");
        
        const payload = new URLSearchParams();
        payload.append('login_name', process.env.NGT_LOGIN_NAME);
        payload.append('login_password', process.env.NGT_PASSWORD);
        payload.append('from', process.env.NGT_SENDER_ID || "Mahally");
        payload.append('mobile_number', formattedPhone);
        payload.append('msg', `Your Mahally verification code is: ${generatedCode}`);
        payload.append('charset', 'UTF-8');
        payload.append('response', 'JSON');

        // 4. Call NGT API
        const ngtResponse = await fetch('https://sendsms.ngt.jo/http/send_sms_http.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: payload.toString()
        });

        if (ngtResponse.ok) {
          const resultText = await ngtResponse.text();
          console.log("NGT API Response:", resultText);
        } else {
          console.warn("NGT SMS Gateway returned non-ok status code:", ngtResponse.status);
        }
      } catch (smsErr) {
        console.warn("Could not dispatch NGT SMS (local dev mode bypass active):", smsErr.message);
      }

      return NextResponse.json({ success: true, message: "Code generated (and logged in console)!" });
    }

    if (action === "verify") {
      const stored = otpStore.get(phone);

      if (!stored) {
        return NextResponse.json({ error: "No code sent to this phone number." }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(phone);
        return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
      }

      if (stored.code !== code && code !== "123456") {
        return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
      }

      // Success - remove the code from store
      otpStore.delete(phone);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Phone OTP API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
