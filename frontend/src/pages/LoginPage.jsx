import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login }     = useAuth()
  const navigate      = useNavigate()
  const location      = useLocation()
  const from          = location.state?.from?.pathname || '/dashboard'

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#241e30] flex">
      {/* ── Left Panel (Image & Branding) ────────────────────── */}
      <div 
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-cover bg-center" 
        style={{ backgroundImage: "url('/pic-2.png')" }}
      >
        <div className="absolute inset-0 bg-[#241e30]/50 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241e30]/90 via-transparent to-[#241e30]/30" />
        
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <span className="text-xl">🏙️</span>
            </div>
            <span className="text-white font-display font-bold text-2xl tracking-tight">Mardan</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all text-white text-sm font-medium border border-white/10 hover:border-white/20">
            Back to website <span className="text-base leading-none">→</span>
          </Link>
        </div>

        {/* Bottom text */}
        <div className="relative z-10 mb-8">
          <h2 className="text-white font-display text-5xl font-medium leading-[1.15] mb-8 tracking-tight max-w-lg">
            Welcome Back,<br />Smart Citizen
          </h2>
          <div className="flex gap-2">
            <div className="w-12 h-1 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            <div className="w-8 h-1 rounded-full bg-white/30" />
            <div className="w-8 h-1 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative overflow-y-auto">
        {/* Mobile back button */}
        <Link to="/" className="lg:hidden absolute top-8 right-8 text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2">
          <span>✕</span> Close
        </Link>

        <div className="w-full max-w-md mx-auto">
          <h1 className="text-white font-display font-medium text-4xl mb-2 tracking-tight">Log in</h1>
          <p className="text-white/50 text-base mb-10">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 hover:underline transition-colors underline-offset-4">
              Register here
            </Link>
          </p>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6 animate-fade-in">
              <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
              <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-white/70 text-xs font-semibold mb-3 tracking-wider uppercase">Demo Credentials</p>
            <div className="flex flex-col gap-2 text-sm text-white/50 font-mono">
              <div className="flex justify-between items-center">
                <span>Email:</span>
                <button
                  type="button"
                  onClick={() => setForm({ email: 'demo@mardancity.pk', password: 'demo1234' })}
                  className="text-brand-400 hover:text-brand-300 transition-colors"
                >
                  demo@mardancity.pk
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span>Password:</span>
                <span className="text-white/70">demo1234</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Email */}
            <div>
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/60 focus:bg-brand-500/5 transition disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/60 focus:bg-brand-500/5 transition disabled:opacity-50 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Remember Me / Forgot Password */}
            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-5 h-5 rounded flex items-center justify-center transition-all border bg-brand-500 border-brand-500">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <span className="text-white/70 text-sm">Remember me</span>
              </label>
              <a href="#" className="text-sm text-brand-400 hover:text-brand-300 hover:underline underline-offset-2 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-4 text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4 hover:bg-brand-400 bg-brand-500"
              style={{
                boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(139, 92, 246, 0.39)',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-medium">Or log in with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-sm font-medium text-white">
              <span className="text-lg leading-none">🇬</span> Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-transparent hover:bg-white/5 transition-colors text-sm font-medium text-white">
              <span className="text-lg leading-none">🍎</span> Apple
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
