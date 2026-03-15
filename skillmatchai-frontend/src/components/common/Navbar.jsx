// src/components/common/Navbar.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  BrainCircuit, Menu, X, LogOut, ChevronDown,
  Briefcase, Award, Mic, LayoutDashboard,
  TrendingUp, Zap, Shield, Eye, Lock
} from 'lucide-react'

export default function Navbar() {
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const location          = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)

  const active = (path) => location.pathname === path ? 'text-cyan-400' : 'text-slate-400 hover:text-white'

  const getDash = () => {
    if (!user) return '/login'
    if (user.role === 'recruiter')     return '/recruiter'
    if (user.role === 'pwd_candidate') return '/pwd-dashboard'
    return '/dashboard'
  }

  const handleLogout = () => { logout(); navigate('/') }

  // Feature links shown in dropdown
  const featureLinks = [
    { icon: Shield,    to: '/certificates',  label: 'AI Certificate Validation', color: 'text-cyan-400' },
    { icon: TrendingUp,to: '/skill-gap',     label: 'Skill Gap Analysis',        color: 'text-purple-400' },
    { icon: Zap,       to: '/jobs',          label: 'Smart Job Matching',        color: 'text-yellow-400' },
    { icon: Mic,       to: '/mock-interview',label: 'Mock Interviews',           color: 'text-green-400' },
    { icon: Eye,       to: '/pwd-dashboard', label: 'PWD Accessibility',        color: 'text-orange-400' },
    { icon: Lock,      to: '/verify',        label: 'Blockchain Verify',         color: 'text-blue-400' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <BrainCircuit size={16} className="text-cyan-400" />
          </div>
          <span className="font-display font-bold text-lg text-white hidden sm:block">SkillMatchAI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">

          {/* Features Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFeaturesOpen(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-body text-sm"
            >
              Features <ChevronDown size={14} className={`transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>

            {featuresOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFeaturesOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-2xl border border-white/10 p-2 z-20 shadow-2xl">
                  {featureLinks.map(f => (
                    <Link
                      key={f.to}
                      to={f.to}
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <f.icon size={15} className={f.color} />
                      <span className="font-body text-sm text-slate-300 hover:text-white">{f.label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link to="/verify" className={`px-4 py-2 rounded-xl font-body text-sm transition-all hover:bg-white/5 ${active('/verify')}`}>
            Verify
          </Link>

          {user && (
            <Link to={getDash()} className={`px-4 py-2 rounded-xl font-body text-sm transition-all hover:bg-white/5 ${active(getDash())}`}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <span className="font-display font-bold text-xs text-cyan-400">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="font-body text-xs text-white leading-none">{user.name?.split(' ')[0]}</p>
                  <p className="font-body text-xs text-slate-500 capitalize leading-none mt-0.5">{user.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-body text-sm"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="font-body text-sm text-slate-400 hover:text-white px-3 py-2 transition-colors">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(v => !v)} className="md:hidden text-slate-400 hover:text-white p-2">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden glass-strong border-t border-white/5 px-4 py-4 space-y-1">
          {featureLinks.map(f => (
            <Link key={f.to} to={f.to} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5">
              <f.icon size={15} className={f.color} />
              <span className="font-body text-sm text-slate-300">{f.label}</span>
            </Link>
          ))}
          <div className="border-t border-white/5 pt-3 mt-3">
            {user ? (
              <>
                <Link to={getDash()} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 font-body text-sm text-slate-300">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-500/10 font-body text-sm text-red-400">
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 font-body text-sm text-slate-300">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full text-center text-sm py-2.5 mt-2 block">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
