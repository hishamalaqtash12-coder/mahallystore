import { NextResponse } from "next/server";
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from "@/lib/announcements";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getAnnouncements();
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createAnnouncement(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) throw new Error("ID is required");
    const result = await updateAnnouncement(id, updates);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get("id");
    if (!rawId) throw new Error("ID is required");
    
    // Convert to number if possible, otherwise keep as string
    const id = isNaN(rawId) ? rawId : Number(rawId);
    
    await deleteAnnouncement(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
