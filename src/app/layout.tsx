import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SystemTourModal } from '@/components/tour/SystemTourModal';

export const metadata: Metadata = {
  title: 'TraduzTudo OS — Gestão Inteligente para Empresas de Tradução',
  description:
    'Sistema operacional SaaS completo para gestão de traduções juramentadas, certificadas, técnicas, CRM, ordens de serviço, financeiro e portal do cliente.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
        <AuthProvider>
          {children}
          <Suspense fallback={null}>
            <SystemTourModal />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
