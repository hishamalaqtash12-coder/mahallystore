import { NextResponse } from "next/server";
import { dokanApi } from "@/lib/dokan";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendor ID" }, { status: 400 });
    }

    try {
      // 1. Fetch History
      const data = await dokanApi.getWithdrawals(vendorId);
      
      // 2. Fetch Balance and Settings (Min limit, Methods, etc.)
      const balanceData = await dokanApi.getBalance(vendorId);

      // 3. Fetch Charges
      let charges = {};
      try {
        charges = await dokanApi.getWithdrawCharges();
      } catch (e) {
        console.warn("Failed to fetch charges:", e.message);
      }

      return NextResponse.json({ 
        withdrawals: (Array.isArray(data) ? data : []).filter(w => String(w.vendor_id || w.user_id) === String(vendorId)),
        balance: balanceData.current_balance || 0,
        settings: {
          minLimit: balanceData.withdraw_limit || 0,
          methods: balanceData.withdraw_methods || [],
          threshold: balanceData.withdraw_threshold || 0,
          charges: charges
        }
      });
    } catch (err) {
      console.warn("Withdraw fetch restricted, returning empty list:", err.message);
      return NextResponse.json({ withdrawals: [], balance: 0, settings: { minLimit: 50, methods: ["bank"], threshold: 0 } });
    }
  } catch (error) {
    console.error("Critical withdraw error:", error);
    return NextResponse.json({ withdrawals: [], balance: 0, settings: { minLimit: 50, methods: ["bank"], threshold: 0 } }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, amount, method } = body;

    if (!vendorId || !amount || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await dokanApi.requestWithdraw(vendorId, amount, method);
    return NextResponse.json(res);
  } catch (error) {
    console.error("Dokan withdraw request error:", error);
    return NextResponse.json({ error: "Failed to submit withdrawal request", details: error.message }, { status: 500 });
  }
}
