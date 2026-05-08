'use client';

import { useState } from 'react';
import Link from 'next/link';
import LeftPanel from '@/components/LeftPanel';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon, CheckCircleIcon, WarningIcon } from '@/components/Icons';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass]  = useState(false);
  const [loading, setLoading]    = useState(false);
  const [alert, setAlert]        = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      setAlert({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setAlert({ type: data.success ? 'success' : 'error', message: data.message });
    } catch {
      setAlert({ type: 'error', message: 'Cannot reach server' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0a0a14] min-h-screen flex overflow-hidden">
      <LeftPanel variant="login" />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-linear-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AuthGuard</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1.5">Welcome back</h1>
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2.5 ${
              alert.type === 'error'
                ? 'bg-red-500/10 border border-red-500/25 text-red-400'
                : 'bg-green-500/10 border border-green-500/25 text-green-400'
            }`}>
              {alert.type === 'error'
                ? <WarningIcon className="w-4 h-4 mt-0.5 shrink-0" />
                : <CheckCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{alert.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>

            {/* Email or Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Email or Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter email or username"
                  className="input-field w-full bg-[#13131f] border border-white/10 text-white placeholder-gray-600 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500/70 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field w-full bg-[#13131f] border border-white/10 text-white placeholder-gray-600 pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500/70 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  title="Toggle password visibility"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="glow-btn w-full bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
