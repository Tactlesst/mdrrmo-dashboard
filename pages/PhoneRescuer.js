import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from "next/router";


export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const LoginProcess = () => {
    router.push('/Admin');
  };

  return (
    <div
      className="relative bg-gray-100 flex items-center justify-center min-h-screen overflow-hidden"
      style={{
        backgroundImage: 'url("/bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-lg bg-white bg-opacity-90 rounded-lg shadow-md p-10 z-10">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Log in</h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">
            Invalid email or password.
          </p>
        )}

        <form action="/api/login" method="POST" className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password:
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-600">
              <input type="checkbox" name="remember" className="mr-2" />
              Remember Me
            </label>
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-800 text-white rounded-full hover:bg-blue-900 transition"
            onClick={LoginProcess}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
