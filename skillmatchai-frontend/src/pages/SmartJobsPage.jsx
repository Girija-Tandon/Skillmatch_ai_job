// src/pages/SmartJobsPage.jsx — Feature 3: Smart Job Matching (TF-IDF + cosine similarity)
// GET /api/jobs/recommended  → AI-matched jobs with % score
// GET /api/jobs              → all jobs
// POST /api/jobs/:id/apply   → apply
import { useState, useEffect } from 'react'
import { jobAPI } from '../utils/api'
import {
  Zap, Briefcase, MapPin, DollarSign, Search,
  Filter, RefreshCw, CheckCircle2, AlertCircle,
  ArrowRight, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SmartJobsPage() {
  const [jobs,       setJobs]       = useState([])
  const [allJobs,    setAllJobs]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [tab,        setTab]        = useState('recommended') // recommended | all
  const [search,     setSearch]     = useState('')
  const [applying,   setApplying]   = useState(null)
  const [applied,    setApplied]    = useState(new Set())

  // ✅ GET /api/jobs/recommended — TF-IDF + cosine similarity scores
  const fetchRecommended = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await jobAPI.getRecommended()
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load recommendations. Run the backend.')
    } finally { setLoading(false) }
  }

  // ✅ GET /api/jobs — all jobs
  const fetchAll = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await jobAPI.getAll()
      setAllJobs(data.jobs || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load jobs.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchRecommended()
    fetchAll()
  }, [])

  // ✅ POST /api/jobs/:id/apply
  const handleApply = async (jobId) => {
    setApplying(jobId)
    try {
      await jobAPI.apply(jobId)
      setApplied(prev => new Set([...prev, jobId]))
      toast.success('Application submitted! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not apply')
    } finally { setApplying(null) }
  }

  const displayJobs = tab === 'recommended' ? jobs : allJobs
  const filtered    = displayJobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase()) ||
    (j.required_skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  const ScoreBar = ({ score }) => {
    const color = score >= 70 ? 'from-green-500 to-cyan-500' : score >= 40 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-orange-500'
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
        <span className={`font-display font-bold text-sm w-10 text-right ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-slate-400'}`}>
          {score}%
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950 pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">
              <span className="text-gradient">Smart Job</span> Matching
            </h1>
            <p className="font-body text-slate-400 mt-1">TF-IDF + cosine similarity algorithm matches your skills to jobs</p>
          </div>
          <button
            onClick={() => { tab === 'recommended' ? fetchRecommended() : fetchAll() }}
            className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw size={14}/> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
          {[
            { id: 'recommended', label: `AI Matched (${jobs.length})` },
            { id: 'all',         label: `All Jobs (${allJobs.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-lg font-body text-sm transition-all ${tab === t.id ? 'bg-cyan-500 text-navy-950 font-medium' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, location, or skill..."
            className="input pl-10 text-sm"
          />
        </div>

        {/* Algorithm explanation */}
        {tab === 'recommended' && (
          <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl mb-6">
            <Zap size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-medium text-white">How AI Matching Works</p>
              <p className="font-body text-xs text-slate-400 mt-0.5">
                Your skills (from validated certificates) are TF-IDF vectorized and compared to job requirements using cosine similarity.
                A skill overlap bonus is added. Final score = 0–99%. Jobs above 60% are strong matches.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
            <button onClick={fetchRecommended} className="text-xs text-red-400 flex items-center gap-1">
              <RefreshCw size={11}/> Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-40 skeleton rounded-2xl"/>)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && !error && (
          <div className="card text-center py-16">
            <Briefcase size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="font-body text-slate-400 mb-1">
              {tab === 'recommended' ? 'No matches yet — upload certificates to get AI job matches' : 'No jobs found'}
            </p>
            {tab === 'recommended' && (
              <a href="/certificates" className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2 mt-4">
                Upload Certificates <ArrowRight size={14}/>
              </a>
            )}
          </div>
        )}

        {/* Job cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(job => (
              <div key={job.id} className="card hover:-translate-y-1 transition-all duration-200">

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-white">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                      <span className="flex items-center gap-1 font-body text-xs text-slate-500">
                        <MapPin size={11}/> {job.location || 'Remote'}
                      </span>
                      {job.salary_max > 0 && (
                        <span className="flex items-center gap-1 font-body text-xs text-slate-500">
                          <DollarSign size={11}/>
                          ₹{(job.salary_min/100000).toFixed(1)}L–{(job.salary_max/100000).toFixed(1)}L
                        </span>
                      )}
                      {job.is_remote && <span className="badge-green text-xs">Remote</span>}
                    </div>
                  </div>
                  {job.matchScore > 0 && (
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className={`font-display font-bold text-2xl ${job.matchScore >= 70 ? 'text-green-400' : job.matchScore >= 40 ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {job.matchScore}%
                      </div>
                      <div className="font-body text-xs text-slate-600">match</div>
                    </div>
                  )}
                </div>

                {/* Match score bar */}
                {job.matchScore > 0 && <ScoreBar score={job.matchScore} />}

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {(job.required_skills || []).slice(0,5).map(s => (
                    <span key={s} className="badge-cyan text-xs">{s}</span>
                  ))}
                  {(job.required_skills || []).length > 5 && (
                    <span className="font-body text-xs text-slate-500">+{(job.required_skills || []).length - 5} more</span>
                  )}
                </div>

                {/* Description snippet */}
                {job.description && (
                  <p className="font-body text-xs text-slate-500 mb-4 line-clamp-2">{job.description}</p>
                )}

                {/* Apply button */}
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={applying === job.id || applied.has(job.id)}
                  className={`w-full py-2.5 rounded-xl font-body text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed
                    ${applied.has(job.id)
                      ? 'bg-green-500/15 border border-green-500/25 text-green-400'
                      : 'btn-primary'}`}
                >
                  {applying === job.id
                    ? <><Loader2 size={14} className="animate-spin"/> Applying...</>
                    : applied.has(job.id)
                    ? <><CheckCircle2 size={14}/> Applied ✓</>
                    : <>Apply Now <ArrowRight size={14}/></>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
