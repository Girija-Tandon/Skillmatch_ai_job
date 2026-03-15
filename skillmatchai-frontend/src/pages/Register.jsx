// src/pages/Register.jsx — Connected to POST /api/auth/register
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrainCircuit, Eye, EyeOff, User, Mail, Lock, UserCheck, AlertCircle, Briefcase, Heart } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { id: 'jobseeker',     icon: User,      label: 'Job Seeker',    desc: 'Find AI-matched jobs' },
  { id: 'recruiter',     icon: Briefcase, label: 'Recruiter',     desc: 'Post & manage jobs' },
  { id: 'pwd_candidate', icon: Heart,     label: 'PWD Candidate', desc: 'Accessible hiring' },
]

export default function Register() {
  const [searchParams]          = useSearchParams()
  const defaultRole             = searchParams.get('role') || 'jobseeker'
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: defaultRole })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { register }            = useAuth()
  const navigate                = useNavigate()

  // Password strength: 0–4
  const strength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      // ✅ Calls POST /api/auth/register → creates user in Directus DB → returns JWT
      const user = await register(form)
      toast.success(`Account created! Welcome, ${user.name} 🎉`)

      // Redirect to correct dashboard based on role returned by backend
      if      (user.role === 'recruiter')      navigate('/recruiter')
      else if (user.role === 'pwd_candidate')  navigate('/pwd-dashboard')
      else                                     navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0]?.message || err.message || 'Registration failed. Check backend is running on port 5000.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-navy-950">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <BrainCircuit size={18} className="text-cyan-400" />
            </div>
            <span className="font-display font-bold text-xl text-white">SkillMatchAI</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Create Your Account</h1>
          <p className="font-body text-slate-400">Start your AI-powered career journey</p>
        </div>

        <div className="card">
          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Role selector → sent to backend as `role` field */}
          <div className="mb-6">
            <label className="block font-body text-sm text-slate-400 mb-3">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.id }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center
                    ${form.role === r.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                    }`}
                >
                  <r.icon size={20} />
                  <span className="font-body text-xs font-medium leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
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

              {/* Password strength meter */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <p className="font-body text-xs text-slate-500">{strengthLabel} password</p>
                </div>
              )}
            </div>

            {/* Submit → POST /api/auth/register */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2 disabled:opacity-60"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                : <><UserCheck size={16} /> Create Account</>
              }
            </button>
          </form>

          <p className="text-center font-body text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
