import Head from 'next/head';
import Image from 'next/image';
import { FiExternalLink, FiDownload, FiBell, FiFileText, FiUsers } from 'react-icons/fi';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [websiteUrl, setWebsiteUrl] = useState('https://mdrrmo.example.com');
  const [apkUrl, setApkUrl] = useState('/apk/mddrmo-app.apk');
  const [responderApkUrl, setResponderApkUrl] = useState('');
  const [residentApkUrl, setResidentApkUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          if (data.website_url) setWebsiteUrl(data.website_url);
          if (data.apk_url) setApkUrl(data.apk_url);
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
        <title>MDRRMO | Welcome</title>
        <meta name="description" content="Official landing page for MDRRMO dashboard and mobile app." />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image src="/Logoo.png" alt="MDRRMO" fill sizes="48px" className="object-contain" priority />
              </div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">MDRRMO</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-3">
              <a href="/login" className="px-4 py-2 rounded-full bg-white text-blue-900 hover:bg-blue-50 shadow-sm transition-colors">Admin Login</a>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20" aria-hidden>
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-200 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-100 blur-3xl" />
          </div>
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 text-center relative">
          <div className="mx-auto mb-8 md:mb-10 relative w-28 h-28">
            <Image src="/Logoo.png" alt="MDRRMO" fill sizes="112px" className="object-contain" priority />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">Municipal Disaster Risk Reduction Management Office</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Connecting the community with timely alerts, incident reporting, and responsive coordination.</p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/30 transition-colors"
            >
              <FiExternalLink className="w-5 h-5" />
              <span>Visit MDRRMO Website</span>
            </a>
            <a
              href="/downloads"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-blue-700 font-semibold border border-blue-200 hover:bg-blue-50 shadow transition-colors"
            >
              <FiDownload className="w-5 h-5" />
              <span>Download Responder App (APK)</span>
            </a>
          </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center">Highlights</h3>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-shadow">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <FiBell className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Real-time Alerts</h4>
              <p className="mt-2 text-gray-600">Receive and manage disaster and incident alerts with updated locations and status.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-shadow">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <FiFileText className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Incident Reporting</h4>
              <p className="mt-2 text-gray-600">Streamlined reporting and logs to ensure accurate data for rapid response.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-shadow">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <FiUsers className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Team Coordination</h4>
              <p className="mt-2 text-gray-600">Coordinate responders and resources with a modern, easy-to-use dashboard.</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between">
            <span>&copy; {new Date().getFullYear()} MDRRMO</span>
            <a href="/login" className="mt-2 sm:mt-0 text-blue-700 hover:underline">Admin Login</a>
          </div>
        </footer>
      </main>
    </>
  );
}
