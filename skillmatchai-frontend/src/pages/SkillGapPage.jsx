// src/pages/SkillGapPage.jsx — Fixed: role dropdown no longer overrides custom input
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { skillAPI, certificateAPI } from '../utils/api'
import {
  TrendingUp, CheckCircle2, XCircle, BookOpen,
  ExternalLink, RefreshCw, Target, Loader2,
  WifiOff, Plus, X, Save, ChevronDown
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const ROLES = [
  'Data Analyst','Data Scientist','Full Stack Developer','Frontend Engineer',
  'Backend Developer','DevOps Engineer','UI/UX Designer','Machine Learning Engineer',
  'Python Developer','React Developer','Node.js Developer','Mobile Developer',
]

export default function SkillGapPage() {
  const { user, updateProfile } = useAuth()
  const [gapData,    setGapData]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [targetRole, setTargetRole] = useState('Data Analyst')  // sensible default
  const [customSkill,setCustomSkill]= useState('')
  const [mySkills,   setMySkills]   = useState(user?.skills || [])
  const [saving,     setSaving]     = useState(false)
  const [marketData, setMarketData] = useState([])

  // Fetch gap analysis — uses whatever targetRole is currently set
  const fetchGap = async (role = targetRole) => {
    if (!role.trim()) { toast.error('Enter a target role'); return }
    setLoading(true); setError('')
    try {
      const [gapRes, mktRes] = await Promise.allSettled([
        skillAPI.getGap(role.trim()),
        skillAPI.getMarketDemand(),
      ])
      if (gapRes.status === 'fulfilled') setGapData(gapRes.value.data)
      else setError(gapRes.reason?.response?.data?.error || 'Could not load gap data')
      if (mktRes.status === 'fulfilled') setMarketData(mktRes.value.data.topSkills || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Backend not reachable')
    } finally { setLoading(false) }
  }

  // Load certs to auto-fill skills
  const loadFromCerts = async () => {
    try {
      const { data } = await certificateAPI.getAll()
      const certSkills = (data.certificates || [])
        .filter(c => c.status === 'valid')
        .flatMap(c => c.ai_skills || [])
      const unique = [...new Set([...mySkills, ...certSkills])]
      setMySkills(unique)
      toast.success(`Loaded ${certSkills.length} skills from certificates`)
    } catch { toast.error('Could not load certificates') }
  }

  const addSkill = () => {
    const s = customSkill.trim()
    if (!s) return
    if (mySkills.includes(s)) { toast.error('Already added'); return }
    setMySkills(prev => [...prev, s])
    setCustomSkill('')
  }

  const removeSkill = (s) => setMySkills(prev => prev.filter(x => x !== s))

  const saveSkills = async () => {
    setSaving(true)
    try {
      await skillAPI.updateSkills(mySkills)
      await updateProfile({ skills: mySkills })
      toast.success('Skills saved!')
      fetchGap()
    } catch { toast.error('Could not save skills') }
    finally { setSaving(false) }
  }

  useEffect(() => {
    if ((user?.skills || []).length > 0) {
      setMySkills(user.skills)
      fetchGap('Data Analyst')
    }
  }, [])

  return (
    <div className="min-h-screen bg-navy-950 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="text-slate-500 hover:text-white text-sm font-body flex items-center gap-1 mb-2">← Dashboard</Link>
            <h1 className="font-display font-bold text-3xl text-white">Skill Gap <span className="text-gradient">Analysis</span></h1>
            <p className="font-body text-slate-400 mt-1">Compare your skills against any target role</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Target Role — FIXED: dropdown sets role, custom input overrides it */}
            <div className="card">
              <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                <Target size={16} className="text-cyan-400" /> Target Role
              </h3>

              {/* Dropdown for quick select */}
              <div className="relative mb-3">
                <select
                  value={ROLES.includes(targetRole) ? targetRole : ''}
                  onChange={e => {
                    if (e.target.value) setTargetRole(e.target.value)
                  }}
                  className="input text-sm pr-8 appearance-none"
                >
                  <option value="">— Quick select —</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>

              {/* Custom input — what actually gets sent */}
              <input
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchGap()}
                placeholder="Type your target role..."
                className="input text-sm mb-3"
              />

              <button
                onClick={() => fetchGap()}
                disabled={loading || !targetRole.trim()}
                className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
                  : <><TrendingUp size={14} /> Analyze Gap</>}
              </button>
            </div>

            {/* My Skills */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                  My Skills ({mySkills.length})
                </h3>
                <button onClick={loadFromCerts} className="text-xs text-cyan-400 hover:text-cyan-300 font-body">
                  Load from certs
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-8 mb-3">
                {mySkills.length === 0
                  ? <p className="text-xs text-slate-600 font-body">No skills yet — add below</p>
                  : mySkills.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <span className="font-body text-xs text-cyan-400">{s}</span>
                      <button onClick={() => removeSkill(s)} className="text-cyan-700 hover:text-red-400 ml-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))
                }
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill..."
                  className="input text-sm py-2 flex-1"
                />
                <button onClick={addSkill} className="btn-ghost py-2 px-3 text-sm flex items-center gap-1">
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={saveSkills}
                disabled={saving}
                className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save to Profile
              </button>
            </div>
          </div>

          {/* ── RIGHT PANELS ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <WifiOff size={16} className="text-red-400" />
                <p className="font-body text-sm text-red-400">{error}</p>
                <button onClick={() => fetchGap()} className="ml-auto text-red-400 hover:text-red-300">
                  <RefreshCw size={14} />
                </button>
              </div>
            )}

            {loading && (
              <div className="card flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-3" />
                  <p className="font-body text-slate-400">Analyzing your skills for <span className="text-white font-medium">{targetRole}</span>...</p>
                </div>
              </div>
            )}

            {!loading && gapData && (
              <>
                {/* Career Readiness */}
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-white">
                      Career Readiness for <span className="text-cyan-400">{gapData.targetRole || targetRole}</span>
                    </h3>
                    <span className="font-display font-bold text-2xl text-gradient">{gapData.readinessScore || 0}%</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${gapData.readinessScore || 0}%`,
                        background: 'linear-gradient(90deg, #06B6D4, #8B5CF6)',
                      }}
                    />
                  </div>
                  {gapData.summary && <p className="font-body text-sm text-slate-400">{gapData.summary}</p>}
                </div>

                {/* Strong vs Missing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <p className="font-body text-xs text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Strong Skills ✓
                    </p>
                    <div className="space-y-2">
                      {(gapData.strongSkills || []).length === 0
                        ? <p className="font-body text-xs text-slate-600">None detected yet</p>
                        : (gapData.strongSkills || []).map(s => (
                          <div key={s} className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/10 rounded-lg">
                            <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                            <span className="font-body text-sm text-white">{s}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div className="card">
                    <p className="font-body text-xs text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <XCircle size={12} /> Missing Skills ✗
                    </p>
                    <div className="space-y-2">
                      {(gapData.missingSkills || []).length === 0
                        ? <p className="font-body text-xs text-green-400">🎉 Great match!</p>
                        : (gapData.missingSkills || []).map(s => (
                          <div key={s} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                            <XCircle size={12} className="text-red-400 flex-shrink-0" />
                            <span className="font-body text-sm text-white">{s}</span>
                            <button
                              onClick={() => { setCustomSkill(s) }}
                              className="ml-auto text-xs text-cyan-400 hover:text-cyan-300"
                              title="Add to my skills"
                            >+ add</button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>

                {/* Radar Chart */}
                {(gapData.radarData || []).length > 0 && (
                  <div className="card">
                    <h3 className="font-display font-semibold text-white mb-4">Skill Radar</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={gapData.radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.07)" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                        <Radar dataKey="score" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recommended Courses */}
                {(gapData.courses || []).length > 0 && (
                  <div className="card">
                    <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                      <BookOpen size={16} className="text-cyan-400" /> Recommended Courses
                    </h3>
                    <div className="space-y-2">
                      {gapData.courses.map((c, i) => (
                        <a key={i} href={c.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 p-3 glass rounded-xl hover:border-cyan-500/20 transition-all group">
                          <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={15} className="text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm text-white group-hover:text-cyan-300 transition-colors">{c.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-body text-xs text-slate-500">{c.platform}</span>
                              {c.free && <span className="badge-green px-1.5 py-0.5 text-xs">Free</span>}
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-slate-600 group-hover:text-cyan-400 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Market Demand */}
            {marketData.length > 0 && (
              <div className="card">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-400" /> Top Skills in Demand
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={marketData.slice(0, 10)} margin={{ left: -20 }}>
                    <XAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {marketData.slice(0,10).map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#06B6D4' : '#8B5CF6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
