'use client';

import { useEffect, useState } from 'react';

export default function Settings() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [apkUrl, setApkUrl] = useState('');
  const [responderApkUrl, setResponderApkUrl] = useState('');
  const [residentApkUrl, setResidentApkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        setWebsiteUrl(data.website_url || '');
        setApkUrl(data.apk_url || '');
        setResponderApkUrl(data.responder_apk_url || '');
        setResidentApkUrl(data.resident_apk_url || '');
      } catch (_) {}
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: websiteUrl,
          apk_url: apkUrl,
          responder_apk_url: responderApkUrl,
          resident_apk_url: residentApkUrl,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage('Saved');
    } catch (_) {
      setMessage('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MDRRMO Website URL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default APK URL (fallback)</label>
          <input
            type="text"
            value={apkUrl}
            onChange={(e) => setApkUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="/apk/mddrmo-app.apk"
          />
          <p className="text-xs text-gray-500 mt-1">Place files in <code>/public/apk/</code> or provide an external link.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Responder APK URL</label>
          <input
            type="text"
            value={responderApkUrl}
            onChange={(e) => setResponderApkUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="/apk/responder-app.apk"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resident APK URL</label>
          <input
            type="text"
            value={residentApkUrl}
            onChange={(e) => setResidentApkUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="/apk/resident-app.apk"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-lg text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {message && (
            <span className={`text-sm ${message === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
