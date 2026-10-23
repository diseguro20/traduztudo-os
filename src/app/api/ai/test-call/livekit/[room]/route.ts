import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params;
  return NextResponse.json({
    room,
    ended: false,
    closed: false,
    conversationId: `conv_${room.replace('kloel-web-', '')}`,
  });
}
