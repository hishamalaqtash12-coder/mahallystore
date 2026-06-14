import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "logs", "activity.json");

// Ensure logs directory exists
if (!fs.existsSync(path.join(process.cwd(), "logs"))) {
  fs.mkdirSync(path.join(process.cwd(), "logs"));
}

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
    
    // Filter logs by user
    const userLogs = logs.filter(l => l.userEmail === email || l.userPhone === phone);
    
    return NextResponse.json(userLogs.reverse().slice(0, 50)); // Last 50 entries
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, phone, action, details } = await request.json();
    
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userEmail: email,
      userPhone: phone,
      action,
      details
    };
    
    logs.push(newLog);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { email, phone, id, clearAll } = await request.json();
    let logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
    
    if (clearAll) {
      // Filter out all logs for this user
      logs = logs.filter(l => l.userEmail !== email && l.userPhone !== phone);
    } else if (id) {
      // Delete specific log entry
      logs = logs.filter(l => l.id !== id);
    }
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
