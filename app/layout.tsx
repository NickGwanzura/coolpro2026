import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { OfflineBanner } from '@/components/OfflineBanner';

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
    <html lang="en" className={GeistSans.className}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
