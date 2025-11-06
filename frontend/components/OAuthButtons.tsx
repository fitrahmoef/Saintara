'use client';

import { FaGoogle, FaGithub } from 'react-icons/fa';

/**
 * OAuth Login Buttons
 * Provides Google and GitHub OAuth login options
 */

interface OAuthButtonsProps {
  mode?: 'login' | 'signup';
}

export default function OAuthButtons({ mode = 'login' }: OAuthButtonsProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/oauth/google`;
  };

  const handleGitHubLogin = () => {
    window.location.href = `${API_URL}/api/oauth/github`;
  };

  const actionText = mode === 'login' ? 'Masuk' : 'Daftar';

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Atau {actionText} dengan</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaGoogle className="text-red-500 text-xl" />
          <span className="font-medium text-gray-700">Google</span>
        </button>

        {/* GitHub */}
        <button
          onClick={handleGitHubLogin}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaGithub className="text-gray-800 text-xl" />
          <span className="font-medium text-gray-700">GitHub</span>
        </button>
      </div>
    </div>
  );
}
