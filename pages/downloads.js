import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FiDownload, FiHome, FiSmartphone, FiUsers } from 'react-icons/fi';

export default function DownloadsPage() {
  const [responderApkUrl, setResponderApkUrl] = useState('');
  const [residentApkUrl, setResidentApkUrl] = useState('');
  const [fallbackApkUrl, setFallbackApkUrl] = useState('/apk/mddrmo-app.apk');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          if (data.apk_url) setFallbackApkUrl(data.apk_url);
          if (data.responder_apk_url) setResponderApkUrl(data.responder_apk_url);
          if (data.resident_apk_url) setResidentApkUrl(data.resident_apk_url);
        }
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Head>
        <title>MDRRMO | Downloads</title>
        <meta name="description" content="Download MDRRMO mobile applications" />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <Image src="/Logoo.png" alt="MDRRMO" fill sizes="40px" className="object-contain" priority />
              </div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">MDRRMO Downloads</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-3">
              <a href="/" className="px-4 py-2 rounded-full bg-white text-blue-900 hover:bg-blue-50 shadow-sm transition-colors inline-flex items-center gap-2">
                <FiHome className="w-4 h-4" />
                Home
              </a>
            </nav>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Download the MDRRMO Apps</h2>
          <p className="text-gray-600 text-center mt-2 max-w-2xl mx-auto">Choose your app below. Files are served from MDRRMO or trusted storage. If a specific link is unavailable, the default APK will be used.</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FiSmartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Responder App</h3>
                  <p className="text-sm text-gray-600">For on-field responders and coordinators.</p>
                </div>
              </div>
              <a
                href={responderApkUrl || fallbackApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/30 transition-colors"
              >
                <FiDownload className="w-5 h-5" />
                Download Responder APK
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resident App</h3>
                  <p className="text-sm text-gray-600">For residents to receive alerts and report incidents.</p>
                </div>
              </div>
              <a
                href={residentApkUrl || fallbackApkUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/30 transition-colors"
              >
                <FiDownload className="w-5 h-5" />
                Download Resident APK
              </a>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a href="/" className="text-blue-700 font-medium hover:underline inline-flex items-center gap-2">
              <FiHome className="w-4 h-4" />
              Back to home
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
