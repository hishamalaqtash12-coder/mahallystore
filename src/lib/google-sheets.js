/**
 * Google Sheets integration for Mahally order logging.
 *
 * Strategy: Read the sheet's actual header row (row 1) first, then build
 * the data row by matching each Arabic/English header to the correct value.
 * This makes the integration resilient to column reordering.
 *
 * Required .env variables:
 *   GOOGLE_SHEET_ID              – Spreadsheet ID (from the URL)
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL – Service account email
 *   GOOGLE_PRIVATE_KEY           – PEM private key (with literal \n sequences)
 */

import { google } from "googleapis";

// --------------------------------------------------------------------------
// Authentication
// --------------------------------------------------------------------------

async function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY in .env");
  }

  // .env typically stores the key with literal \n — convert to real newlines
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

// --------------------------------------------------------------------------
// Column → Value mapping
// Covers the Arabic headers used in the Mahally management sheet plus common
// English / alternate Arabic variants so the integration survives minor typos.
// --------------------------------------------------------------------------

function buildDataMap({ orderId, mahallyId, items, customer, shippingFee, orderTotal, merchantName }) {
  const d = new Date();
  // Format as YYYY-MM-DD HH:mm:ss for Google Sheets compatibility
  const now = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  
  const customerName = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

  // Per-item computed values (use first item for single-column cells)
  const firstItem    = items[0] || {};
  const firstName    = firstItem.name || firstItem.title || "";
  const firstPrice   = parseFloat(firstItem.price || firstItem.regular_price || 0);
  const firstQty     = parseInt(firstItem.quantity || 1);
  const firstTotal   = firstPrice * firstQty;

  // Summary for multi-item orders
  const totalQty     = items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0);
  const itemsSummary = items
    .map((i) => `${i.name || i.title || "Product"} (x${i.quantity})`)
    .join(", ");

  const totalStr    = typeof orderTotal === "number" ? orderTotal.toFixed(2) : String(orderTotal ?? 0);
  const shippingStr = String(parseFloat(shippingFee ?? 0).toFixed(2));

  return {
    // ---- Order identification ----
    "رقم الطلب":             String(orderId ?? ""),
    "order id":              String(orderId ?? ""),
    "معرف المحلي":           String(mahallyId ?? ""),
    "mahally id":            String(mahallyId ?? ""),

    // ---- Date / time ----
    "تاريخ الطلب":          now,
    "التاريخ":               now,
    "date":                  now,

    // ---- Merchant / store (both headers map to the same value) ----
    "اسم التاجر":            merchantName || "",
    "اسم المتجر":            merchantName || "",
    "التاجر":                merchantName || "",
    "المتجر":                merchantName || "",
    "merchant name":         merchantName || "",
    "store name":            merchantName || "",

    // ---- Product (first / primary item) ----
    "اسم المنتج":            firstName,
    "المنتج":                firstName,
    "product name":          firstName,
    "product":               firstName,

    // ---- Unit price (price of one unit) ----
    "سعر المنتج":            firstPrice.toFixed(2),
    "سعر الوحدة":            firstPrice.toFixed(2),
    "unit price":            firstPrice.toFixed(2),
    "price":                 firstPrice.toFixed(2),

    // ---- Line total (unit price × quantity) ----
    "إجمالي المنتج":         firstTotal.toFixed(2),
    "سعر المنتج × الكمية":  firstTotal.toFixed(2),
    "line total":            firstTotal.toFixed(2),
    "subtotal":              firstTotal.toFixed(2),

    // ---- Quantity ----
    "الكمية":                String(firstQty),       // first item qty (most common case)
    "الكمية الإجمالية":      String(totalQty),       // all items combined
    "quantity":              String(firstQty),
    "qty":                   String(firstQty),

    // ---- All items summary ----
    "المنتجات":              itemsSummary,
    "items":                 itemsSummary,
    "products":              itemsSummary,

    // ---- Financial ----
    "قيمة الطلب":            totalStr,
    "المجموع الكلي":         totalStr,
    "الإجمالي الكلي":        totalStr,
    "الإجمالي":              totalStr,
    "order value":           totalStr,
    "total":                 totalStr,
    "grand total":           totalStr,

    "رسوم التوصيل":          shippingStr,
    "التوصيل":               shippingStr,
    "delivery fee":          shippingStr,
    "shipping":              shippingStr,
    "shipping fee":          shippingStr,

    "طريقة الدفع":           "الدفع عند الاستلام (COD)",
    "payment method":        "Cash on Delivery",

    // ---- Customer details ----
    "اسم العميل":            customerName,
    "العميل":                customerName,
    "customer name":         customerName,
    "رقم هاتف العميل":       customer.phone ?? "",
    "هاتف العميل":           customer.phone ?? "",
    "الهاتف":                customer.phone ?? "",
    "phone":                 customer.phone ?? "",
    "البريد الإلكتروني":     customer.email ?? "",
    "email":                 customer.email ?? "",
    "عنوان العميل":          customer.address ?? "",
    "العنوان":               customer.address ?? "",
    "address":               customer.address ?? "",
    "المحافظة/المدينة":      customer.city ?? "",
    "المحافظة":              customer.city ?? "",
    "المدينة":               customer.city ?? "",
    "city":                  customer.city ?? "",
    "governorate":           customer.city ?? "",

    // ---- Status ----
    "الحالة":                "قيد الانتظار",
    "status":                "on-hold",
  };
}


// --------------------------------------------------------------------------
// Main export
// --------------------------------------------------------------------------

/**
 * Appends one order row to the Google Sheet.
 * Reads the sheet's header row first and maps data by column name,
 * so the integration is immune to column reordering.
 *
 * @param {object} orderData
 */
export async function appendOrderToSheet(orderData) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.warn("[Sheets] GOOGLE_SHEET_ID not set — skipping");
    return;
  }

  const {
    orderId,
    mahallyId,
    items = [],
    customer = {},
    shippingFee = 0,
    orderTotal = 0,
    merchantName = "",
    primaryVendorId = "",
  } = orderData;

  try {
    const sheets = await getSheetsClient();

    // 1. Read the header row to discover column positions
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!1:1",   // Change "Sheet1" if your tab has a different name
    });
    const headers = (headerRes.data.values?.[0] || []).map((h) => h.trim());

    if (headers.length === 0) {
      console.warn("[Sheets] Sheet has no header row — skipping append");
      return;
    }

    // 2. Build the data map
    const dataMap = buildDataMap({ orderId, mahallyId, items, customer, shippingFee, orderTotal, merchantName });

    // 3. Build the row by matching each header to its value (case-insensitive)
    const row = headers.map((header) => {
      // Try exact match first, then lowercase fallback
      return dataMap[header] ?? dataMap[header.toLowerCase()] ?? "";
    });

    // 4. Append the row
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:Z",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`[Sheets] ✅ Order #${orderId} (${mahallyId}) appended to sheet ${sheetId}`);
  } catch (err) {
    // Never throw — a Sheets failure must never block the checkout response
    console.error("[Sheets] ❌ Failed to append order:", err.message);
  }
}
