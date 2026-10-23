import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    const callerNumber = formData?.get('From') || 'Desconhecido';
    const calledNumber = formData?.get('To') || '+55 11 4003-8822';

    // LiveKit SIP Trunk Domain or direct bridge
    const sipUri = process.env.LIVEKIT_SIP_URI || 'sip:agent@traduztudo.sip.livekit.cloud';

    // TwiML response bridging the telephone call to LiveKit SIP Participant
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="Polly.Camila">Olá, bem-vindo à TraduzTudo. Conectando você ao nosso atendimento inteligente.</Say>
  <Connect>
    <Sip>${sipUri}?caller=${encodeURIComponent(String(callerNumber))}&amp;called=${encodeURIComponent(String(calledNumber))}</Sip>
  </Connect>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('Telephony Webhook error:', error);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Não foi possível conectar ao assistente no momento. Por favor ligue novamente em instantes.</Say>
</Response>`;
    return new NextResponse(fallbackTwiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'TraduzTudo AI Telephony Gateway (Twilio SIP / LiveKit)',
    endpoints: {
      inboundWebhook: '/api/ai/telephony/webhook',
      livekitToken: '/api/ai/test-call/livekit',
    },
  });
}
