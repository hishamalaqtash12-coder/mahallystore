import { NextResponse } from "next/server";

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0, // Expires immediately
  });
  return response;
}
