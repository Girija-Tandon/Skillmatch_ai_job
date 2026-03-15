// src/pages/RecruiterDashboard.jsx
// ✅ FULLY CONNECTED TO BACKEND
// GET  /api/jobs            → load recruiter's jobs
// POST /api/jobs            → post new job
// GET  /api/jobs/:id/applicants → view applicants
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { jobAPI } from '../utils/api'
import {
  Briefcase, Plus, Users, CheckCircle2, Search,
  MapPin, DollarSign, X, Loader2, Eye,
  WifiOff, RefreshCw, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className }) => <div className={`skeleton ${className}`} />

// ── Post Job Modal ─────────────────────────────────────────────────────────────
function PostJobModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', required_skills: '',
    location: '', salary_min: '', salary_max: '', is_remote: false,
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // ✅ POST /api/jobs — creates job in Directus DB
      const payload = {
        ...form,
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        salary_min:       parseInt(form.salary_min)  || 0,
        salary_max:       parseInt(form.salary_max)  || 0,
      }
      const { data } = await jobAPI.create(payload)
      onSuccess(data.job)
      toast.success('Job posted successfully!')
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not post job. Is the backend running?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="font-display font-bold text-xl text-white">Post a New Job</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block font-body text-sm text-slate-400 mb-2">Job Title *</label>
            <input required placeholder="e.g. Senior React Developer"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input" />
          </div>

          <div>
            <label className="block font-body text-sm text-slate-400 mb-2">Location *</label>
            <input required placeholder="e.g. Bangalore / Remote"
              value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className="input" />
          </div>

          <div>
            <label className="block font-body text-sm text-slate-400 mb-2">Required Skills * (comma separated)</label>
            <input required placeholder="React, Node.js, TypeScript, MongoDB"
              value={form.required_skills} onChange={e => setForm(p => ({ ...p, required_skills: e.target.value }))}
              className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">Min Salary (₹/year)</label>
              <input type="number" placeholder="500000"
                value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">Max Salary (₹/year)</label>
              <input type="number" placeholder="1500000"
                value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))}
                className="input" />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-slate-400 mb-2">Job Description * (min 50 chars)</label>
            <textarea required rows={5} minLength={50}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none" />
          </div>

          {/* Remote toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, is_remote: !p.is_remote }))}
              className="text-cyan-400 flex-shrink-0"
            >
              {form.is_remote ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-600" />}
            </button>
            <span className="font-body text-sm text-slate-300">Remote / Work from home</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Recruiter Dashboard ──────────────────────────────────────────────────
export default function RecruiterDashboard() {
  const { user }  = useAuth()
  const [jobs,      setJobs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [search,    setSearch]    = useState('')
  const [activeTab, setActiveTab] = useState('jobs')

  // ── Load jobs from GET /api/jobs ──────────────────────────────────────────
  const fetchJobs = async () => {
    setLoading(true)
    setError('')
    try {
      // ✅ GET /api/jobs — returns all active jobs
      const { data } = await jobAPI.getAll()
      setJobs(data.jobs || [])
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not load jobs. Is the backend running on port 5000?'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  )

  // Summary stats from real data
  const totalApplicants = jobs.reduce((s, j) => s + (j.applications_count || 0), 0)

  return (
    <div className="min-h-screen bg-navy-950 pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">
              Recruiter <span className="text-gradient">Hub</span>
            </h1>
            <p className="font-body text-slate-400 mt-1">
              Welcome, {user?.name} — manage your job listings
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Post New Job
          </button>
        </div>

        {/* Stats — from real backend data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Jobs',         value: loading ? '—' : jobs.filter(j => j.is_active).length, icon: Briefcase,    color: 'bg-cyan-500/20' },
            { label: 'Total Applications',  value: loading ? '—' : totalApplicants,                       icon: Users,        color: 'bg-purple-500/20' },
            { label: 'Verified Candidates', value: '—',                                                    icon: CheckCircle2, color: 'bg-green-500/20' },
            { label: 'This Month',          value: loading ? '—' : jobs.filter(j => {
              const d = new Date(j.created_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length,                                                                                      icon: Plus,         color: 'bg-orange-500/20' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={18} className="text-white" />
              </div>
              <div className="font-display font-bold text-2xl text-white">{s.value}</div>
              <div className="font-body text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
          {['jobs', 'candidates'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-body text-sm capitalize transition-all
                ${activeTab === tab ? 'bg-cyan-500 text-navy-950 font-medium' : 'text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            {/* Search + Refresh */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  placeholder="Search by title or location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-10 text-sm"
                />
              </div>
              <button onClick={fetchJobs} className="btn-ghost flex items-center gap-1.5 text-sm py-2 px-3">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-between p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <WifiOff size={16} className="text-red-400" />
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
                <button onClick={fetchJobs} className="text-xs text-red-400 hover:text-red-300 font-body flex items-center gap-1">
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>

            /* Empty State */
            ) : filtered.length === 0 && !error ? (
              <div className="card text-center py-16">
                <Briefcase size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="font-body text-slate-400 mb-1">
                  {search ? 'No jobs match your search' : 'No jobs posted yet'}
                </p>
                <p className="font-body text-slate-600 text-sm mb-4">
                  {search ? 'Try a different search term' : 'Post your first job listing'}
                </p>
                {!search && (
                  <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-6">
                    Post First Job
                  </button>
                )}
              </div>

            /* Job Cards — real data from backend */
            ) : (
              <div className="space-y-4">
                {filtered.map(job => (
                  <div key={job.id} className="card hover:-translate-y-0.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <Briefcase size={20} className="text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-white">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-slate-500 text-xs font-body">
                              <MapPin size={11} /> {job.location}
                            </span>
                            {job.salary_max > 0 && (
                              <span className="flex items-center gap-1 text-slate-500 text-xs font-body">
                                <DollarSign size={11} />
                                ₹{(job.salary_min/100000).toFixed(1)}L–₹{(job.salary_max/100000).toFixed(1)}L
                              </span>
                            )}
                            {job.is_remote && <span className="badge-green">Remote</span>}
                            <span className={job.is_active ? 'badge-green' : 'badge-red'}>
                              {job.is_active ? 'Active' : 'Closed'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(job.required_skills || []).slice(0, 5).map(s => (
                              <span key={s} className="badge-cyan text-xs">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="font-display font-bold text-xl text-white">
                            {job.applications_count || 0}
                          </div>
                          <div className="font-body text-xs text-slate-500">applicants</div>
                        </div>
                        {/* GET /api/jobs/:id/applicants */}
                        <button
                          onClick={async () => {
                            try {
                              const { data } = await jobAPI.getApplicants(job.id)
                              toast.success(`${data.total} applicant(s) for this job`)
                            } catch (err) {
                              toast.error(err.response?.data?.error || 'Could not load applicants')
                            }
                          }}
                          className="btn-ghost flex items-center gap-1.5 text-sm py-2 px-3"
                        >
                          <Eye size={14} /> View
                        </button>

                        {/* DELETE /api/jobs/:id */}
                        <button
                          onClick={async () => {
                            if (!confirm('Close this job listing?')) return
                            try {
                              await jobAPI.delete(job.id)
                              setJobs(prev => prev.filter(j => j.id !== job.id))
                              toast.success('Job closed')
                            } catch (err) {
                              toast.error(err.response?.data?.error || 'Could not close job')
                            }
                          }}
                          className="btn-danger text-xs"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="card text-center py-16">
            <Users size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="font-body text-slate-400 mb-1">Candidate management coming soon</p>
            <p className="font-body text-slate-600 text-sm">Post jobs first to receive verified applicants</p>
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showModal && (
        <PostJobModal
          onClose={() => setShowModal(false)}
          onSuccess={job => {
            setJobs(prev => [job, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
