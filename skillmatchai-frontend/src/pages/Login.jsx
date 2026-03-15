// src/pages/Login.jsx — Connected to POST /api/auth/login
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrainCircuit, Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // ✅ Calls POST /api/auth/login → gets JWT token → stores in localStorage
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)

      // Redirect based on role from backend response
      if      (user.role === 'recruiter')      navigate('/recruiter')
      else if (user.role === 'pwd_candidate')  navigate('/pwd-dashboard')
      else                                     navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Cannot connect to server. Is backend running on port 5000?'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-navy-950">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BrainCircuit size={18} className="text-cyan-400" />
            </div>
            <span className="font-display font-bold text-xl text-white">SkillMatchAI</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome Back</h1>
          <p className="font-body text-slate-400">Sign in to your account</p>
        </div>

        <div className="card">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email → sent to backend */}
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password → hashed on backend, never stored plain */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-body text-sm text-slate-400">Password</label>
                <Link to="/forgot-password" className="font-body text-xs text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit → POST /api/auth/login */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2 disabled:opacity-60"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>

          <p className="text-center font-body text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300">Sign up free</Link>
          </p>
        </div>

        {/* Backend connection status hint */}
        <p className="text-center font-body text-xs text-slate-700 mt-4">
          Connecting to: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
        </p>
      </div>
    </div>
  )
}
