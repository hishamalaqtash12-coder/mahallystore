/**
 * Test NGT SMS Gateway directly
 * Usage: node scripts/test-sms.mjs +962790910041
 */

const phone = process.argv[2] || "+962790910041";
const formattedPhone = phone.replace("+", "");

const payload = new URLSearchParams();
payload.append("login_name", "mahally");
payload.append("login_password", "BlueMark@2024");
payload.append("from", "Mahally");
payload.append("mobile_number", formattedPhone);
payload.append("msg", "Mahally test message: Your OTP is 123456");
payload.append("charset", "UTF-8");
payload.append("response", "JSON");

console.log("📤 Sending test SMS to:", phone);
console.log("   Formatted number:", formattedPhone);
console.log("   Payload:", Object.fromEntries(payload));

try {
  const res = await fetch("https://sendsms.ngt.jo/http/send_sms_http.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });

  const text = await res.text();
  console.log("\n📨 NGT Raw Response:");
  console.log("   HTTP Status:", res.status);
  console.log("   Body:", text);

  try {
    const json = JSON.parse(text);
    console.log("\n📊 Parsed JSON:", JSON.stringify(json, null, 2));
  } catch {
    console.log("   (Response is not JSON)");
  }
} catch (err) {
  console.error("💥 Network error:", err.message);
}
