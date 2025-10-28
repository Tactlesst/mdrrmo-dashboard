'use client';

import { useEffect, useState } from 'react';
import SecurityLogs from './SecurityLogs';
import { FiSettings, FiShield } from 'react-icons/fi';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
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
    <div className="max-w-6xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiSettings />
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FiShield />
            Security Logs
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="max-w-xl">
          <div className="space-y-4">
        <div>
          <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-1">MDRRMO Website URL</label>
          <input
            id="website-url"
            name="website-url"
            type="url"
            autoComplete="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label htmlFor="default-apk-url" className="block text-sm font-medium text-gray-700 mb-1">Default APK URL (fallback)</label>
          <input
            id="default-apk-url"
            name="default-apk-url"
            type="text"
            autoComplete="off"
            value={apkUrl}
            onChange={(e) => setApkUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            placeholder="/apk/mddrmo-app.apk"
          />
          <p className="text-xs text-gray-500 mt-1">Place files in <code>/public/apk/</code> or provide an external link.</p>
        </div>
        <div>
          <label htmlFor="responder-apk-url" className="block text-sm font-medium text-gray-700 mb-1">Responder APK URL</label>
          <div className="flex gap-2">
            <input
              id="responder-apk-url"
              name="responder-apk-url"
              type="text"
              autoComplete="off"
              value={responderApkUrl}
              onChange={(e) => setResponderApkUrl(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="/apk/responder-app.apk"
            />
            {responderApkUrl && (
              <a
                href={responderApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>📱</span>
                Download
              </a>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="resident-apk-url" className="block text-sm font-medium text-gray-700 mb-1">Resident APK URL</label>
          <div className="flex gap-2">
            <input
              id="resident-apk-url"
              name="resident-apk-url"
              type="text"
              autoComplete="off"
              value={residentApkUrl}
              onChange={(e) => setResidentApkUrl(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
              placeholder="/apk/resident-app.apk"
            />
            {residentApkUrl && (
              <a
                href={residentApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>📱</span>
                Download
              </a>
            )}
          </div>
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
      )}

      {/* Security Logs Tab */}
      {activeTab === 'security' && (
        <SecurityLogs />
      )}
    </div>
  );
}
