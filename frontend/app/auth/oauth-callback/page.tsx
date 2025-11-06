'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * OAuth Callback Handler
 * Handles redirect after OAuth authentication
 */

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNew = searchParams.get('isNew') === 'true';
    const error = searchParams.get('error');

    if (error) {
      // Handle error
      const errorMessages: Record<string, string> = {
        oauth_failed: 'OAuth authentication gagal. Silakan coba lagi.',
        missing_code: 'Kode OAuth tidak ditemukan.',
        email_required: 'Email diperlukan untuk melanjutkan.',
      };

      const errorMessage = errorMessages[error] || 'Terjadi kesalahan saat login.';

      // Redirect to login with error
      router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
      return;
    }

    if (token) {
      // Store token
      localStorage.setItem('token', token);

      // Redirect based on whether user is new
      if (isNew) {
        // New user - maybe show onboarding
        router.push('/dashboard?welcome=true');
      } else {
        // Existing user - go to dashboard
        router.push('/dashboard');
      }
    } else {
      // No token, redirect to login
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Menyelesaikan login...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
