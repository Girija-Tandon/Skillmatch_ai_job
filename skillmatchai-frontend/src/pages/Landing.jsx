// src/pages/Landing.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Shield, TrendingUp, Zap, Mic, Eye, Lock,
  ArrowRight, CheckCircle2, BrainCircuit, ChevronDown
} from 'lucide-react'

const FEATURES = [
  {
    icon: Shield, color: 'bg-cyan-500/20', iconColor: 'text-cyan-400',
    border: 'hover:border-cyan-500/40', badge: 'GPT-4',
    title: 'AI Certificate Validation',
    desc: 'Upload your certificates and our GPT-4 powered system validates them instantly with blockchain-backed proof of authenticity.',
    link: '/certificates', cta: 'Validate Now →',
  },
  {
    icon: TrendingUp, color: 'bg-purple-500/20', iconColor: 'text-purple-400',
    border: 'hover:border-purple-500/40', badge: 'AI Analysis',
    title: 'Skill Gap Analysis',
    desc: 'AI compares your skills to market demand, identifies gaps, and suggests free courses on Coursera, Udemy, and more.',
    link: '/skill-gap', cta: 'Analyze Skills →',
  },
  {
    icon: Zap, color: 'bg-yellow-500/20', iconColor: 'text-yellow-400',
    border: 'hover:border-yellow-500/40', badge: 'TF-IDF',
    title: 'Smart Job Matching',
    desc: 'TF-IDF and cosine similarity algorithms match you to jobs with a precise percentage score so you apply to the right roles.',
    link: '/jobs', cta: 'Find Matches →',
  },
  {
    icon: Mic, color: 'bg-green-500/20', iconColor: 'text-green-400',
    border: 'hover:border-green-500/40', badge: 'Voice AI',
    title: 'Mock Interviews with AI',
    desc: 'Practice with role-specific AI questions, record your voice answers, and get detailed scoring and feedback instantly.',
    link: '/mock-interview', cta: 'Start Practice →',
  },
  {
    icon: Eye, color: 'bg-orange-500/20', iconColor: 'text-orange-400',
    border: 'hover:border-orange-500/40', badge: 'WCAG AA',
    title: 'PWD Accessibility Tools',
    desc: 'Real-time sign language detection, voice-to-text input, text-to-speech output, high contrast mode, and adjustable font sizes.',
    link: '/register?role=pwd_candidate', cta: 'Explore Access →',
  },
  {
    icon: Lock, color: 'bg-blue-500/20', iconColor: 'text-blue-400',
    border: 'hover:border-blue-500/40', badge: 'Polygon',
    title: 'Blockchain Verification',
    desc: 'Every validated certificate is hashed and stored on Polygon blockchain — tamper-proof and verifiable by anyone, forever.',
    link: '/verify', cta: 'Verify Now →',
  },
]

const STEPS = [
  { n: '01', title: 'Register',         desc: 'Free account as Job Seeker, Recruiter, or PWD Candidate' },
  { n: '02', title: 'Upload & Validate', desc: 'GPT-4 validates certificates and stores on blockchain' },
  { n: '03', title: 'AI Matches Jobs',   desc: 'TF-IDF algorithm matches your skills to best jobs' },
  { n: '04', title: 'Practice',          desc: 'Mock interviews with real-time AI feedback' },
  { n: '05', title: 'Get Hired',         desc: 'Apply with blockchain-verified credentials' },
]

export default function Landing() {
  const { user } = useAuth()
  const [verifyHash,   setVerifyHash]   = useState('')
  const [verifying,    setVerifying]    = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (verifyHash.trim().length !== 64) return
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res  = await fetch(`http://localhost:5000/api/blockchain/verify/${verifyHash.trim()}`)
      const data = await res.json()
      setVerifyResult(data)
    } catch {
      setVerifyResult({ isValid: false, error: 'Backend not running on port 5000' })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
        <div className="absolute top-24 left-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 mb-8">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="font-body text-sm text-cyan-400">AI-Powered Career Platform · Free to Use</span>
          </div>

          <h1 className="font-display font-bold text-6xl md:text-7xl text-white leading-[1.05] mb-6 tracking-tight">
            Validate Skills,<br/>
            <span className="text-gradient">Land Your Dream Job</span>
          </h1>

          <p className="font-body text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            GPT-4 certificate validation · blockchain verification · AI job matching
            · mock interviews · full PWD accessibility — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link to={user.role==='recruiter' ? '/recruiter' : user.role==='pwd_candidate' ? '/pwd-dashboard' : '/dashboard'}
                className="btn-primary px-8 py-4 text-lg flex items-center gap-2 justify-center">
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary px-8 py-4 text-lg flex items-center gap-2 justify-center">
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-ghost px-8 py-4 text-lg">Sign In</Link>
              </>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-10 pt-8 border-t border-white/5">
            {[['GPT-4','AI Validation'],['Polygon','Blockchain'],['TF-IDF','Job Matching'],['WCAG AA','Accessible']].map(([v,l]) => (
              <div key={l} className="text-center">
                <div className="font-display font-bold text-2xl text-white">{v}</div>
                <div className="font-body text-xs text-slate-500 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-16 animate-bounce">
          <ChevronDown size={20} className="text-slate-600" />
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────── */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-cyan inline-flex mb-4">Key Features</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
              Everything You Need to <span className="text-gradient">Succeed</span>
            </h2>
            <p className="font-body text-slate-400 max-w-xl mx-auto">
              AI-powered tools built for every job seeker — including full accessibility for persons with disabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Link
                key={i}
                to={f.link}
                className={`card group hover:-translate-y-2 hover:shadow-xl ${f.border} transition-all duration-300 cursor-pointer block`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center`}>
                    <f.icon size={22} className={f.iconColor} />
                  </div>
                  <span className="badge-cyan text-xs">{f.badge}</span>
                </div>
                <h3 className="font-display font-semibold text-lg text-white mb-2">{f.title}</h3>
                <p className="font-body text-sm text-slate-400 leading-relaxed mb-5">{f.desc}</p>
                <span className={`font-body text-sm font-medium ${f.iconColor} group-hover:underline`}>{f.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE BLOCKCHAIN VERIFY ────────────────────── */}
      <section className="py-16 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Lock size={26} className="text-blue-400" />
            </div>
            <h2 className="font-display font-bold text-3xl text-white mb-2">Verify Any Certificate</h2>
            <p className="font-body text-slate-400">Public endpoint — no login required. Enter a SHA-256 hash to verify on blockchain.</p>
          </div>

          <div className="card">
            <form onSubmit={handleVerify} className="space-y-3">
              <input
                value={verifyHash}
                onChange={e => { setVerifyHash(e.target.value); setVerifyResult(null) }}
                placeholder="Enter 64-character certificate hash..."
                className="input font-mono text-sm"
                maxLength={64}
              />
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-slate-600">{verifyHash.length}/64 chars</span>
                <button
                  type="submit"
                  disabled={verifying || verifyHash.trim().length !== 64}
                  className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 disabled:opacity-50"
                >
                  {verifying
                    ? <><div className="w-3.5 h-3.5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"/>Querying...</>
                    : <><Shield size={14}/> Verify on Blockchain</>}
                </button>
              </div>
            </form>

            {verifyResult && (
              <div className={`mt-4 p-4 rounded-xl border ${verifyResult.isValid ? 'bg-green-500/8 border-green-500/20' : 'bg-red-500/8 border-red-500/20'}`}>
                <p className={`font-display font-bold ${verifyResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {verifyResult.isValid ? '✅ Certificate is VALID on Polygon Blockchain' : '❌ Certificate NOT found on blockchain'}
                </p>
                {verifyResult.error && <p className="font-body text-xs text-red-400 mt-1">{verifyResult.error}</p>}
              </div>
            )}
          </div>

          <p className="text-center font-body text-xs text-slate-600 mt-3">
            Or <Link to="/verify" className="text-cyan-400 hover:underline">open the full verify page →</Link>
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-20 px-4" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-4xl text-white mb-3">How It Works</h2>
            <p className="font-body text-slate-400">From signup to hired in 5 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-white/10 flex items-center justify-center mx-auto mb-3">
                  <span className="font-display font-bold text-cyan-400">{s.n}</span>
                </div>
                <h3 className="font-display font-semibold text-white text-sm mb-1.5">{s.title}</h3>
                <p className="font-body text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/register" className="btn-primary px-10 py-4 text-lg inline-flex items-center gap-2">
              Start Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="py-10 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-cyan-400" />
            <span className="font-display font-bold text-white">SkillMatchAI</span>
          </div>
          <p className="font-body text-xs text-slate-600 text-center">
            Built by Mrudula Madhavi · Anushka Sahu · Girija Tandon · Aaditi Thakur
          </p>
          <div className="flex gap-5">
            {[['/',   'Home'],['/verify','Verify'],['/register','Register']].map(([to,label]) => (
              <Link key={to} to={to} className="font-body text-xs text-slate-500 hover:text-white transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
