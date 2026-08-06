import { NextResponse } from 'next/server';

export async function POST(req) {
  return NextResponse.json({ success: true, message: 'Test webhook works!' });
}
