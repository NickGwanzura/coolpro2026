import { Suspense } from 'react';
import { VerifyEmailClient } from './VerifyEmailClient';

export const metadata = { title: 'Confirm your email | HEVACRAZ' };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}
