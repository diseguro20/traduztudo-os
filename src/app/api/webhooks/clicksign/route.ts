import { NextRequest, NextResponse } from 'next/server';
import { clicksignProvider } from '@/lib/signatures/ClicksignSignatureProvider';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const signatureHeader = req.headers.get('x-clicksign-signature') || req.headers.get('authorization') || '';

    const webhookResult = await clicksignProvider.processWebhook(payload, signatureHeader);

    return NextResponse.json({
      received: true,
      handled: webhookResult.handled,
      event: webhookResult.event,
      documentKey: webhookResult.documentKey,
      isCompleted: webhookResult.isCompleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Clicksign webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Webhook error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    provider: 'Clicksign Webhook Listener',
    environment: clicksignProvider.getEnvironmentLabel(),
    timestamp: new Date().toISOString(),
  });
}
