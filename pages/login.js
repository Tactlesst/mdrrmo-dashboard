import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@mdrrmo.com' && password === 'admin123') {
      router.push('/AdminDashboard');
    } else {
      alert('Invalid login credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="mb-6">
          <div className="bg-white rounded-full shadow-md w-24 h-24 mx-auto flex items-center justify-center">
            <Image
              src="/mdrrmo-logo.png"
              alt="MDRRMO Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to access the MDRRMO dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-300 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition duration-200"
          >
            Log In
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} MDRRMO System
        </p>
      </div>
    </div>
  );
}
