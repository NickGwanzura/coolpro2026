import localFont from 'next/font/local';

export const perfectCorporate = localFont({
  src: [
    { path: './perfect-corporate/PerfectCorporate-Thin.ttf', weight: '100', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-Light.ttf', weight: '300', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-Regular.ttf', weight: '400', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-Medium.ttf', weight: '500', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-Bold.ttf', weight: '700', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: './perfect-corporate/PerfectCorporate-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-perfect-corporate',
  display: 'swap',
});
