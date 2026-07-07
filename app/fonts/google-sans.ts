import localFont from 'next/font/local';

export const googleSans = localFont({
  src: [
    { path: './google-sans/GoogleSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: './google-sans/GoogleSans-Italic.ttf', weight: '400', style: 'italic' },
    { path: './google-sans/GoogleSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: './google-sans/GoogleSans-MediumItalic.ttf', weight: '500', style: 'italic' },
    { path: './google-sans/GoogleSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './google-sans/GoogleSans-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: './google-sans/GoogleSans-Bold.ttf', weight: '700', style: 'normal' },
    { path: './google-sans/GoogleSans-BoldItalic.ttf', weight: '700', style: 'italic' },
  ],
  variable: '--font-google-sans',
  display: 'swap',
});
