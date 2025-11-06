'use client';

import { useState, useEffect } from 'react';
import { FaShieldAlt, FaQrcode, FaKey, FaCheck } from 'react-icons/fa';
import axios from 'axios';

/**
 * Two-Factor Authentication Setup Page
 */

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

export default function TwoFactorAuthPage() {
  const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false, backupCodesRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/2fa/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(res.data.data);
    } catch (err: any) {
      setError('Gagal mengambil status 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/2fa/setup',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setQrCode(res.data.data.qrCode);
      setSecret(res.data.data.secret);
      setBackupCodes(res.data.data.backupCodes);
      setSetupMode(true);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/2fa/enable',
        { token: verificationToken },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('2FA berhasil diaktifkan!');
      setStep(3);
      fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengaktifkan 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const token = prompt('Masukkan kode 2FA untuk menonaktifkan:');
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const authToken = localStorage.getItem('token');
      await axios.post(
        '/api/2fa/disable',
        { token },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setSuccess('2FA berhasil dinonaktifkan');
      fetchStatus();
      setSetupMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menonaktifkan 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const token = prompt('Masukkan kode 2FA untuk regenerate backup codes:');
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const authToken = localStorage.getItem('token');
      const res = await axios.post(
        '/api/2fa/backup-codes/regenerate',
        { token },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      setBackupCodes(res.data.data.backupCodes);
      setSuccess('Backup codes berhasil di-generate ulang');
      fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saintara-backup-codes.txt';
    a.click();
  };

  if (loading && !setupMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <FaShieldAlt className="text-purple-600 text-3xl mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Two-Factor Authentication</h1>
            <p className="text-gray-600">Tambahkan lapisan keamanan ekstra untuk akun Anda</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Status Display */}
        {!setupMode && (
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">Status 2FA</p>
                <p className={`text-sm ${status.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {status.enabled ? 'Aktif' : 'Tidak Aktif'}
                </p>
              </div>
              <div>
                {status.enabled ? (
                  <button
                    onClick={handleDisable}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    Nonaktifkan
                  </button>
                ) : (
                  <button
                    onClick={handleSetup}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    disabled={loading}
                  >
                    Aktifkan 2FA
                  </button>
                )}
              </div>
            </div>

            {status.enabled && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Backup codes tersisa: <strong>{status.backupCodesRemaining}</strong>
                </p>
                <button
                  onClick={handleRegenerateBackupCodes}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Regenerate backup codes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Setup Flow */}
        {setupMode && (
          <div>
            {/* Step 2: Scan QR Code */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 rounded-full p-2">
                    <FaQrcode className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Scan QR Code</h3>
                    <p className="text-sm text-gray-600">
                      Gunakan Google Authenticator atau aplikasi TOTP lainnya
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64 border-2 border-gray-300 rounded" />
                  <p className="mt-4 text-sm text-gray-600">
                    Atau masukkan kode ini secara manual:
                  </p>
                  <code className="mt-2 bg-gray-100 px-4 py-2 rounded font-mono text-sm">{secret}</code>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Masukkan Kode Verifikasi (6 digit)
                  </label>
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-purple-600"
                    placeholder="000000"
                  />
                </div>

                <button
                  onClick={handleEnable}
                  disabled={verificationToken.length !== 6 || loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded disabled:opacity-50"
                >
                  {loading ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
                </button>
              </div>
            )}

            {/* Step 3: Save Backup Codes */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 rounded-full p-2">
                    <FaCheck className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">2FA Berhasil Diaktifkan!</h3>
                    <p className="text-sm text-gray-600">
                      Simpan backup codes untuk recovery akun
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-400 p-4 rounded">
                  <p className="text-sm text-yellow-800 font-semibold mb-2">
                    ⚠️ Penting: Simpan backup codes ini di tempat aman!
                  </p>
                  <p className="text-sm text-yellow-700">
                    Backup codes dapat digunakan jika Anda kehilangan akses ke authenticator app.
                    Setiap code hanya bisa digunakan sekali.
                  </p>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="bg-white px-3 py-2 rounded text-center font-mono">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={downloadBackupCodes}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded"
                  >
                    Download Backup Codes
                  </button>
                  <button
                    onClick={() => {
                      setSetupMode(false);
                      setStep(1);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Apa itu 2FA?</h4>
          <p className="text-sm text-gray-700">
            Two-Factor Authentication menambahkan lapisan keamanan ekstra dengan memerlukan kode verifikasi
            dari aplikasi authenticator setiap kali Anda login, selain password.
          </p>
        </div>
      </div>
    </div>
  );
}
