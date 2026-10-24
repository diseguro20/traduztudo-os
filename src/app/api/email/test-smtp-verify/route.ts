import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const smtpHost = process.env.HOSTINGER_SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = Number(process.env.HOSTINGER_SMTP_PORT) || 465;
  const smtpUser = process.env.HOSTINGER_SMTP_USER || 'contato@traduztudo.com';
  const smtpPass = process.env.HOSTINGER_SMTP_PASS;

  if (!smtpPass) {
    return NextResponse.json({ success: false, error: 'HOSTINGER_SMTP_PASS não definida.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: 'SMTP Hostinger autenticado e 100% ativo para envio!',
      user: smtpUser,
      host: smtpHost,
      port: smtpPort,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message,
      code: err?.code,
      response: err?.response,
      command: err?.command,
    });
  }
}
