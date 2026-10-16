import { NextRequest, NextResponse } from 'next/server';
import { prospectingStorage } from '@/lib/storage/prospectingStorage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('E-mail não especificado.', { status: 400 });
    }

    const email = decodeURIComponent(token).toLowerCase().trim();
    await prospectingStorage.addToSuppression(email, undefined, 'OPTOUT', 'Descadastrado via link direto no e-mail.');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Descadastro Confirmado — Traduz Tudo</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
          .icon { width: 56px; height: 56px; background-color: #065f46; color: #34d399; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px; }
          h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #ffffff; }
          p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
          .email-badge { background-color: #0f172a; border: 1px solid #334155; padding: 8px 16px; border-radius: 8px; font-family: monospace; color: #38bdf8; font-size: 13px; display: inline-block; margin-bottom: 24px; }
          .btn { background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block; transition: background 0.2s; }
          .btn:hover { background-color: #1d4ed8; }
          .footer { font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Descadastro Confirmado</h1>
          <p>O seu e-mail foi removido com sucesso de todas as nossas listas de comunicações comerciais ativas, em conformidade com a LGPD (Lei 13.709/2018).</p>
          <div class="email-badge">${email}</div>
          <div>
            <a href="https://traduztudo.com" class="btn">Visitar Traduz Tudo</a>
          </div>
          <div class="footer">
            Traduz Tudo — Traduções Juramentadas e Certificadas<br/>
            contato@traduztudo.com | São Paulo, Brasil
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err: any) {
    console.error('[API /api/prospecting/unsubscribe] Error:', err);
    return new NextResponse('Erro ao processar solicitação de descadastro.', { status: 500 });
  }
}
