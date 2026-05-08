import { ShieldCheckIcon, LockIcon, UserPlusIcon } from '@/components/Icons';

export default function LeftPanel({ variant = 'login' }) {
  const isLogin = variant === 'login';

  return (
    <div className="hidden lg:flex lg:w-[45%] relative bg-[#0d0d1f] flex-col justify-between p-12 overflow-hidden border-r border-white/5">
      <div className="blob1" />
      <div className="blob2" />
      <div className="blob3" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
          <ShieldCheckIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">AuthGuard</span>
      </div>

      {/* Animated illustration */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-12">
        <div className="relative w-56 h-56 mx-auto mb-10">

          {/* Outer dashed ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-purple-600/30 animate-spin-slow" />

          {/* Orbit track 1 */}
          <div className="orbit-track orbit-track-1">
            <div className="orbit-dot orbit-dot-1" />
          </div>

          {/* Mid ring */}
          <div className="absolute inset-5 rounded-full border border-purple-700/20 animate-spin-slow-rev" />

          {/* Orbit track 2 */}
          <div className="absolute inset-5 orbit-track orbit-track-2">
            <div className="orbit-dot orbit-dot-2" />
          </div>

          {/* Glow ring */}
          <div className="absolute inset-6 rounded-full bg-linear-to-br from-purple-900/60 to-violet-900/40 border border-purple-700/30 animate-glow-pulse flex items-center justify-center shadow-2xl shadow-purple-950/60">
            <div className="w-28 h-28 rounded-full bg-linear-to-br from-purple-800/60 to-violet-800/40 flex items-center justify-center border border-purple-600/40">
              <div className="animate-float">
                {isLogin
                  ? <LockIcon className="w-14 h-14 text-purple-300" />
                  : <UserPlusIcon className="w-14 h-14 text-purple-300" />
                }
              </div>
            </div>
          </div>

          {/* Orbit track 3 */}
          <div className="absolute -inset-3 orbit-track orbit-track-3">
            <div className="orbit-dot orbit-dot-3" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 w-full max-w-xs">
          {[
            { value: 'AES-256', label: 'Encryption', color: 'text-purple-400' },
            { value: 'bcrypt',  label: 'Hashing',    color: 'text-violet-400' },
            { value: 'SSL/TLS', label: 'Transport',   color: 'text-purple-300' },
          ].map(({ value, label, color }) => (
            <div key={label} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
              <p className={`${color} font-bold text-base`}>{value}</p>
              <p className="text-gray-600 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div className="relative z-10">
        <h2 className="text-white text-2xl font-bold leading-snug mb-2">
          {isLogin ? <>Securing Your<br />Digital Identity</> : <>Join Thousands<br />of Teams</>}
        </h2>
        <p className="text-gray-500 text-sm">
          {isLogin
            ? 'Enterprise-grade authentication & access control'
            : 'Secure, scalable, and trusted by organisations worldwide'}
        </p>
        <div className="flex gap-2 mt-5">
          <div className={`${isLogin ? 'w-7 bg-purple-500' : 'w-2 bg-gray-700'} h-1.5 rounded-full`} />
          <div className={`${!isLogin ? 'w-7 bg-purple-500' : 'w-2 bg-gray-700'} h-1.5 rounded-full`} />
          <div className="w-2 h-1.5 bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
