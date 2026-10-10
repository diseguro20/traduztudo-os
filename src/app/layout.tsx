import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
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
    <html lang="pt-BR" className="h-full dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('traduztudo_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="h-full bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Suspense fallback={null}>
              <SystemTourModal />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
