// src/pages/JobSeekerDashboard.jsx
// ✅ FULLY CONNECTED TO BACKEND
// GET /api/certificates       → load certificates
// GET /api/jobs/recommended   → AI-matched jobs
// GET /api/skills/gap         → skill gap analysis
// POST /api/certificates      → upload (via CertificateUpload component)
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { certificateAPI, jobAPI, skillAPI } from '../utils/api'
import {
  Award, Zap, TrendingUp, Briefcase, Mic, ArrowRight,
  CheckCircle2, Clock, XCircle, Lock, Upload, ChevronRight,
  BookOpen, BarChart2, RefreshCw, AlertCircle, WifiOff
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer
} from 'recharts'
import CertificateUpload from '../components/certificate/CertificateUpload'
import toast from 'react-hot-toast'

// ── Loading Skeleton ──────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`skeleton ${className}`} />
)

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="stat-card">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    {loading
      ? <Skeleton className="h-7 w-16 mb-1" />
      : <div className="font-display font-bold text-2xl text-white">{value}</div>
    }
    <div className="font-body text-sm text-slate-400">{label}</div>
  </div>
)

// ── Certificate status badge ──────────────────────────────────────────────────
const CertBadge = ({ status }) => {
  const map = {
    valid:      { cls: 'badge-green',  icon: CheckCircle2, label: 'Valid'           },
    pending:    { cls: 'badge-orange', icon: Clock,        label: 'Pending'         },
    needs_test: { cls: 'badge-orange', icon: Clock,        label: 'Test Required'   },
    invalid:    { cls: 'badge-red',    icon: XCircle,      label: 'Invalid'         },
    revoked:    { cls: 'badge-red',    icon: XCircle,      label: 'Revoked'         },
  }
  const s = map[status] || map.pending
  return <span className={s.cls}><s.icon size={11} /> {s.label}</span>
}

// ── Error Banner ──────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
    <div className="flex items-center gap-2">
      <WifiOff size={16} className="text-red-400" />
      <p className="font-body text-sm text-red-400">{message}</p>
    </div>
    {onRetry && (
      <button onClick={onRetry} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-body">
        <RefreshCw size={13} /> Retry
      </button>
    )}
  </div>
)

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function JobSeekerDashboard() {
  const { user }  = useAuth()
  const [certs,    setCerts]    = useState([])
  const [jobs,     setJobs]     = useState([])
  const [skillGap, setSkillGap] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeTab,  setActiveTab]  = useState('overview')

  // Loading states per section
  const [loadingCerts, setLoadingCerts]    = useState(true)
  const [loadingJobs,  setLoadingJobs]     = useState(true)
  const [loadingSkills,setLoadingSkills]   = useState(true)

  // Error states per section
  const [errorCerts,  setErrorCerts]   = useState('')
  const [errorJobs,   setErrorJobs]    = useState('')
  const [errorSkills, setErrorSkills]  = useState('')

  // ── Fetch certificates from GET /api/certificates ────────────────────────
  const fetchCerts = async () => {
    setLoadingCerts(true)
    setErrorCerts('')
    try {
      const { data } = await certificateAPI.getAll()
      setCerts(data.certificates || [])
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not load certificates. Is the backend running?'
      setErrorCerts(msg)
    } finally {
      setLoadingCerts(false)
    }
  }

  // ── Fetch AI-recommended jobs from GET /api/jobs/recommended ─────────────
  const fetchJobs = async () => {
    setLoadingJobs(true)
    setErrorJobs('')
    try {
      const { data } = await jobAPI.getRecommended()
      setJobs(data.jobs || [])
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not load job matches. Is the backend running?'
      setErrorJobs(msg)
    } finally {
      setLoadingJobs(false)
    }
  }

  // ── Fetch skill gap from GET /api/skills/gap ──────────────────────────────
  const fetchSkillGap = async () => {
    setLoadingSkills(true)
    setErrorSkills('')
    try {
      const { data } = await skillAPI.getGap()
      setSkillGap(data)
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not load skill analysis. Is the backend running?'
      setErrorSkills(msg)
    } finally {
      setLoadingSkills(false)
    }
  }

  // Load all data on mount
  useEffect(() => {
    fetchCerts()
    fetchJobs()
    fetchSkillGap()
  }, [])

  const validCerts = certs.filter(c => c.status === 'valid').length
  const needsTest  = certs.filter(c => c.status === 'needs_test').length

  return (
    <div className="min-h-screen bg-navy-950 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white">
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="font-body text-slate-400 mt-1">Your AI-powered career dashboard</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2">
            <Upload size={16} /> Upload Certificate
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Award}      label="Valid Certificates" value={validCerts}                          color="bg-cyan-500/20"   loading={loadingCerts} />
          <StatCard icon={Briefcase}  label="Job Matches"        value={jobs.length}                         color="bg-purple-500/20" loading={loadingJobs} />
          <StatCard icon={TrendingUp} label="Readiness Score"    value={`${skillGap?.readinessScore ?? '—'}%`} color="bg-green-500/20"  loading={loadingSkills} />
          <StatCard icon={Clock}      label="Needs Attention"    value={needsTest}                           color="bg-orange-500/20" loading={loadingCerts} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
          {['overview', 'certificates', 'jobs', 'skills'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-body text-sm capitalize transition-all
                ${activeTab === tab ? 'bg-cyan-500 text-navy-950 font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Skill Radar */}
            <div className="card">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-cyan-400" /> Skill Radar
              </h3>
              {loadingSkills ? (
                <div className="h-52 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : errorSkills ? (
                <div className="h-52 flex flex-col items-center justify-center gap-2 text-center">
                  <AlertCircle size={24} className="text-red-400" />
                  <p className="font-body text-xs text-red-400">{errorSkills}</p>
                  <button onClick={fetchSkillGap} className="text-xs text-cyan-400 hover:text-cyan-300 font-body flex items-center gap-1">
                    <RefreshCw size={11} /> Retry
                  </button>
                </div>
              ) : skillGap?.radarData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={skillGap.radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'DM Sans' }} />
                    <Radar name="Skills" dataKey="score" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center gap-2 text-center">
                  <BarChart2 size={28} className="text-slate-700" />
                  <p className="font-body text-sm text-slate-500">Upload certificates to see skill data</p>
                </div>
              )}
            </div>

            {/* Recent Certificates */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white flex items-center gap-2">
                  <Award size={16} className="text-cyan-400" /> Certificates
                </h3>
                <button onClick={() => setActiveTab('certificates')} className="text-xs text-cyan-400 hover:text-cyan-300 font-body">
                  View all →
                </button>
              </div>

              {loadingCerts ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : errorCerts ? (
                <ErrorBanner message={errorCerts} onRetry={fetchCerts} />
              ) : certs.length === 0 ? (
                <div className="text-center py-8">
                  <Upload size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="font-body text-sm text-slate-500">No certificates yet</p>
                  <button onClick={() => setShowUpload(true)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-body">
                    Upload your first →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {certs.slice(0, 4).map(cert => (
                    <div key={cert.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="font-body text-sm text-white truncate max-w-[160px]">{cert.ai_course_name || cert.original_name || 'Certificate'}</p>
                        <p className="font-body text-xs text-slate-500">{cert.ai_issuer || 'Unknown issuer'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <CertBadge status={cert.status} />
                        {cert.blockchain_tx_hash && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Lock size={9} /> On-chain
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Job Matches */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white flex items-center gap-2">
                  <Zap size={16} className="text-cyan-400" /> AI Job Matches
                </h3>
                <button onClick={() => setActiveTab('jobs')} className="text-xs text-cyan-400 hover:text-cyan-300 font-body">
                  View all →
                </button>
              </div>

              {loadingJobs ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : errorJobs ? (
                <ErrorBanner message={errorJobs} onRetry={fetchJobs} />
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="font-body text-sm text-slate-500">No matches yet</p>
                  <p className="font-body text-xs text-slate-600 mt-1">Upload certificates to get matched</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 4).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 glass rounded-xl hover:border-white/10 transition-all group">
                      <div>
                        <p className="font-body text-sm font-medium text-white">{job.title}</p>
                        <p className="font-body text-xs text-slate-500">{job.location || 'Remote'}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-lg text-cyan-400">{job.matchScore}%</div>
                        <div className="font-body text-xs text-slate-600">match</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CERTIFICATES TAB ── */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">
                Your Certificates {!loadingCerts && `(${certs.length})`}
              </h2>
              <button onClick={() => setShowUpload(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
                <Upload size={14} /> Upload New
              </button>
            </div>

            {loadingCerts ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
              </div>
            ) : errorCerts ? (
              <ErrorBanner message={errorCerts} onRetry={fetchCerts} />
            ) : certs.length === 0 ? (
              <div className="card text-center py-16">
                <Upload size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="font-body text-slate-400 mb-1">No certificates uploaded yet</p>
                <p className="font-body text-slate-600 text-sm mb-4">Upload your first certificate to start getting AI job matches</p>
                <button onClick={() => setShowUpload(true)} className="btn-primary text-sm py-2 px-6">Upload Certificate</button>
              </div>
            ) : (
              certs.map(cert => (
                <div key={cert.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Award size={22} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-white">{cert.ai_course_name || cert.original_name || 'Certificate'}</h3>
                        <p className="font-body text-sm text-slate-400">{cert.ai_issuer || 'Unknown Issuer'}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(cert.ai_skills || []).slice(0, 5).map(skill => (
                            <span key={skill} className="badge-cyan text-xs">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <CertBadge status={cert.status} />
                      {cert.ai_confidence && (
                        <span className="font-body text-xs text-slate-500">AI confidence: {cert.ai_confidence}%</span>
                      )}
                      {cert.blockchain_tx_hash && (
                        <span className="flex items-center gap-1 font-mono text-xs text-green-400">
                          <Lock size={10} /> {cert.blockchain_tx_hash.slice(0, 16)}...
                        </span>
                      )}
                      {cert.status === 'needs_test' && (
                        <Link to={`/verify-test/${cert.id}`} className="btn-primary text-xs py-1.5 px-3">
                          Take Skill Test →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── JOBS TAB ── */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-white">
                AI-Matched Jobs {!loadingJobs && `(${jobs.length})`}
              </h2>
              <button onClick={fetchJobs} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white font-body">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loadingJobs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
              </div>
            ) : errorJobs ? (
              <ErrorBanner message={errorJobs} onRetry={fetchJobs} />
            ) : jobs.length === 0 ? (
              <div className="card text-center py-16">
                <Briefcase size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="font-body text-slate-400 mb-1">No job matches found</p>
                <p className="font-body text-slate-600 text-sm">Upload certificates so AI can match your skills to jobs</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <div key={job.id} className="card hover:-translate-y-1 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-semibold text-white">{job.title}</h3>
                        <p className="font-body text-sm text-slate-400">{job.location || 'Remote'}</p>
                        {job.salary_max > 0 && (
                          <p className="font-body text-xs text-slate-500 mt-0.5">
                            ₹{(job.salary_min/100000).toFixed(1)}L – ₹{(job.salary_max/100000).toFixed(1)}L
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-2xl text-cyan-400">{job.matchScore}%</div>
                        <div className="font-body text-xs text-slate-600">match</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                        style={{ width: `${job.matchScore}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(job.required_skills || []).slice(0, 4).map(s => (
                        <span key={s} className="badge-cyan text-xs">{s}</span>
                      ))}
                    </div>
                    {/* POST /api/jobs/:id/apply */}
                    <button
                      onClick={async () => {
                        try {
                          await jobAPI.apply(job.id)
                          toast.success('Application submitted!')
                        } catch (err) {
                          toast.error(err.response?.data?.error || 'Could not apply')
                        }
                      }}
                      className="btn-primary w-full text-sm py-2.5"
                    >
                      Apply Now <ArrowRight size={14} className="inline ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SKILLS TAB ── */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Skill Gap Analysis */}
            <div className="card">
              <h3 className="font-display font-semibold text-white mb-4">Skill Gap Analysis</h3>
              {loadingSkills ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : errorSkills ? (
                <ErrorBanner message={errorSkills} onRetry={fetchSkillGap} />
              ) : !skillGap ? (
                <p className="font-body text-sm text-slate-500">No skill data yet. Upload certificates first.</p>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-sm text-slate-400">Career Readiness</span>
                      <span className="font-display font-bold text-cyan-400">{skillGap.readinessScore}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${skillGap.readinessScore}%` }}
                      />
                    </div>
                    {skillGap.summary && (
                      <p className="font-body text-xs text-slate-500 mt-2">{skillGap.summary}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-body text-xs text-green-400 uppercase tracking-wider mb-2">Strong Skills ✓</p>
                      <div className="space-y-1.5">
                        {(skillGap.strongSkills || []).map(s => (
                          <div key={s} className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                            <span className="font-body text-sm text-white">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-body text-xs text-orange-400 uppercase tracking-wider mb-2">Missing Skills ✗</p>
                      <div className="space-y-1.5">
                        {(skillGap.missingSkills || []).map(s => (
                          <div key={s} className="flex items-center gap-2">
                            <XCircle size={12} className="text-orange-400 flex-shrink-0" />
                            <span className="font-body text-sm text-white">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recommended Courses + Interview Link */}
            <div className="card">
              <h3 className="font-display font-semibold text-white mb-4">Recommended Courses</h3>
              {loadingSkills ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (skillGap?.courses || []).length === 0 ? (
                <p className="font-body text-sm text-slate-500">No courses recommended yet.</p>
              ) : (
                <div className="space-y-3">
                  {(skillGap.courses || []).map((course, i) => (
                    <a
                      key={i}
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 p-3 glass rounded-xl hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-white text-sm">{course.title}</p>
                        <p className="font-body text-xs text-slate-500">{course.platform} {course.free ? '· Free' : ''}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 mt-1 flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              )}

              {/* Interview Practice Link */}
              <Link
                to="/mock-interview"
                className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl hover:border-cyan-500/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Mic size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-body font-medium text-white text-sm">Practice Mock Interview</p>
                    <p className="font-body text-xs text-slate-500">AI questions + real-time feedback</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Upload Modal */}
      {showUpload && (
        <CertificateUpload
          onClose={() => setShowUpload(false)}
          onSuccess={(cert) => {
            setCerts(prev => [cert, ...prev])
            setShowUpload(false)
            // Refresh jobs and skills since new cert adds new skills
            fetchJobs()
            fetchSkillGap()
            toast.success('Certificate uploaded! Refreshing matches...')
          }}
        />
      )}
    </div>
  )
}
