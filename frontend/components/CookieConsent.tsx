'use client';

import { useState, useEffect } from 'react';
import { FaCookie, FaTimes } from 'react-icons/fa';

/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent management
 */

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      const saved = JSON.parse(consent);
      setPreferences(saved);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    savePreferences(onlyNecessary);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t-4 border-purple-600 p-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <FaCookie className="text-purple-600 text-3xl flex-shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-2">Kami menggunakan cookies</h3>
            <p className="text-gray-600 text-sm">
              Kami menggunakan cookies untuk meningkatkan pengalaman Anda.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRejectAll} className="px-6 py-2 border rounded-lg">
            Tolak
          </button>
          <button onClick={handleAcceptAll} className="px-6 py-2 bg-purple-600 text-white rounded-lg">
            Terima
          </button>
        </div>
      </div>
    </div>
  );
}
