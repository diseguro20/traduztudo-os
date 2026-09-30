import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TraduzTudo OS — Gestão Inteligente para Empresas de Tradução',
  description:
    'Sistema operacional SaaS completo para gestão de traduções juramentadas, certificadas, técnicas, CRM, ordens de serviço, financeiro e portal do cliente.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
