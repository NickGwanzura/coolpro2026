import type { Metadata } from 'next';
import './globals.css';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AuthProvider } from '@/lib/auth';
import { FloatingVoiceButton } from '@/components/FloatingVoiceButton';

export const metadata: Metadata = {
  title: 'HEVACRAZ - HVAC-R Association Zimbabwe',
  description: 'HVAC-R Association of Zimbabwe - Professional Training & Compliance Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-google-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased font-google-sans">
        <AuthProvider>
          <OfflineBanner />
          {children}
          <FloatingVoiceButton />
        </AuthProvider>
      </body>
    </html>
  );
}
