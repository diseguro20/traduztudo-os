import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const agentId = body.agentId || 'agt-traduztudo-principal';

    // Generate room name matching Kloel AI regex: /^kloel-web-[a-f0-9]{16}$/
    const hex16 = crypto.randomBytes(8).toString('hex');
    const room = `kloel-web-${hex16}`;
    const conversationId = `conv_${Date.now()}_${hex16.slice(0, 8)}`;

    const apiKey = process.env.LIVEKIT_API_KEY || 'traduztudo_livekit_dev_key';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'traduztudo_livekit_dev_secret_32bytes_long!';
    const livekitUrl = process.env.LIVEKIT_URL || 'wss://traduztudo-voice.livekit.cloud';

    // Create LiveKit Access Token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `caller_${crypto.randomBytes(4).toString('hex')}`,
      name: 'Cliente TraduzTudo',
      metadata: JSON.stringify({
        agentId,
        conversationId,
        platform: 'web',
      }),
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      url: livekitUrl,
      token,
      room,
      conversationId,
      mode: process.env.LIVEKIT_URL ? 'livekit_cloud' : 'local_ready',
    });
  } catch (error: any) {
    console.error('Error generating LiveKit test call token:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao iniciar servidor de voz' },
      { status: 500 }
    );
  }
}
