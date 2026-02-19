import type { Metadata } from 'next';
import './globals.css';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'CoolPro Toolkit',
  description: 'Commercial Refrigeration Training & Low-GWP Compliance Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <OfflineBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
