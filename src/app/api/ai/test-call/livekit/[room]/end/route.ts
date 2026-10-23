import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ room: string }> }
) {
  try {
    const { room } = await params;
    const body = await req.json().catch(() => ({}));
    const conversationId = body.conversationId || `conv_${room.replace('kloel-web-', '')}`;

    return NextResponse.json({
      room,
      ended: true,
      closed: true,
      conversationId,
    });
  } catch (error: any) {
    console.error('Error ending livekit call:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao encerrar chamada' },
      { status: 500 }
    );
  }
}
