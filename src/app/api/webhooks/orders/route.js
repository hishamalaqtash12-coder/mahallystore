import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req) {
  try {
    const order = await req.json();

    // 1. Calculate Delivery Fee automatically based on City/Governorate
    const city = (order.shipping?.city || order.billing?.city || "").trim().toLowerCase();
    const ammanVariations = ["amman", "عمان", "عمّان", "am", "amm"];
    const isAmman = ammanVariations.includes(city);
    const deliveryFee = isAmman ? 2 : 3;

    // 2. Prepare Data Row (Exactly 23 columns)
    const rowData = [
      order.id || "N/A",
      order.date_created || new Date().toISOString(),
      "Mahally",
      "Mahally Store",
      `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(),
      order.billing?.phone || "",
      `${order.billing?.address_1 || ""} ${order.billing?.address_2 || ""}`.trim(),
      order.shipping?.city || order.billing?.city || "",
      (order.line_items || []).map(i => i.name).join(" + "),
      (order.line_items || []).reduce((sum, item) => sum + (item.quantity || 1), 0),
      order.total || "0",
      order.payment_method_title || "",
      order.status || "",
      "",  // Delivery Company
      "",  // Driver Name
      "",  // Pickup Date
      "",  // Pickup Status
      "",  // Delivery Date
      "",  // Delivery Status
      "",  // Tracking Number
      "",  // Estimated Delivery Time
      deliveryFee,
      order.customer_note || ""
    ];

    // 3. Authenticate with Google Sheets
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, '\n');
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json({ success: false, error: "Configuration missing" }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 4. Arabic Headers (23 columns)
    const headersRow = [
      "رقم الطلب", "تاريخ الطلب", "اسم التاجر", "اسم المتجر", "اسم العميل",
      "رقم هاتف العميل", "عنوان العميل", "المحافظة/المدينة", "اسم المنتج",
      "الكمية", "قيمة الطلب", "طريقة الدفع", "حالة الدفع", "شركة التوصيل",
      "اسم السائق", "تاريخ استلام الطلب", "حالة الاستلام", "تاريخ التسليم",
      "حالة التوصيل", "رقم التتبع", "موعد التسليم المتوقع", "رسوم التوصيل", "الملاحظات"
    ];

    // 5. Check if Row 1 (A1) already has headers
    const checkRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1',
    });

    const hasHeaders = checkRes.data.values && checkRes.data.values[0] && checkRes.data.values[0][0];

    if (!hasHeaders) {
      // Write headers to A1:W1
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:W1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headersRow] },
      });
    }

    // 6. Append order data below the headers
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1:W1', // Anchor to row 1, appends below last used row
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowData] },
    });

    return NextResponse.json({ success: true, message: "Order pushed to Google Sheets successfully!" });

  } catch (error) {
    console.error("Error pushing to Google Sheets:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
