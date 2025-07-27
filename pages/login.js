import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push(data.redirect);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="mb-6">
          <div className="bg-white rounded-full shadow-md w-24 h-24 mx-auto relative overflow-hidden">
            <Image
              src="/Logoo.png"
              alt="MDRRMO Logo"
              fill
              sizes="96px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to access the MDRRMO dashboard.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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

// ⛔ Prevent access to login page if already authenticated
export async function getServerSideProps({ req }) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return {
        redirect: {
          destination: '/AdminDashboard',
          permanent: false,
        },
      };
    } catch (e) {
      // Invalid or expired token — allow access
    }
  }

  return {
    props: {},
  };
}
