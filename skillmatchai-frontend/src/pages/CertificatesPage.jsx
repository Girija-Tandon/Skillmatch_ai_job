// src/pages/CertificatesPage.jsx — Feature 1: AI Certificate Validation
// POST /api/certificates (upload + GPT-4 validate + blockchain register)
// GET  /api/certificates (list all)
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { certificateAPI } from '../utils/api'
import {
  Award, Upload, CheckCircle2, Clock, XCircle, Lock,
  RefreshCw, FileText, Image, AlertCircle, ChevronRight,
  Shield, Brain, Zap, X, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS = {
  valid:      { cls: 'badge-green',  icon: CheckCircle2, label: 'Valid' },
  pending:    { cls: 'badge-orange', icon: Clock,        label: 'Pending' },
  needs_test: { cls: 'badge-orange', icon: Clock,        label: 'Test Required' },
  invalid:    { cls: 'badge-red',    icon: XCircle,      label: 'Invalid' },
  revoked:    { cls: 'badge-red',    icon: XCircle,      label: 'Revoked' },
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')
  const [drag,     setDrag]     = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setResult(null); setError('') }
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      // ✅ POST /api/certificates → OCR → GPT-4 → blockchain → returns result
      const { data } = await certificateAPI.upload(file)
      setResult(data)
      toast.success('Certificate processed!')
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Is the backend running?'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const confidenceColor = (c) => c >= 70 ? 'text-green-400' : c >= 40 ? 'text-yellow-400' : 'text-red-400'
  const confidenceBg    = (c) => c >= 70 ? 'bg-green-500' : c >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Upload Certificate</h2>
            <p className="font-body text-xs text-slate-400 mt-0.5">GPT-4 validates · OCR extracts text · Blockchain registers</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Pipeline steps */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { icon: FileText, label: 'OCR Scan',    desc: 'Extract text',         color: 'text-cyan-400'   },
              { icon: Brain,    label: 'GPT-4 AI',    desc: 'Validate & score',     color: 'text-purple-400' },
              { icon: Shield,   label: 'Blockchain',  desc: 'Register on Polygon',  color: 'text-blue-400'   },
            ].map((s,i) => (
              <div key={i} className="glass rounded-xl p-3 text-center">
                <s.icon size={18} className={`${s.color} mx-auto mb-1.5`} />
                <p className="font-body text-xs font-medium text-white">{s.label}</p>
                <p className="font-body text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Drop zone */}
          {!result && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('cert-file').click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${drag ? 'border-cyan-500 bg-cyan-500/10' : file ? 'border-green-500/40 bg-green-500/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
              >
                <input id="cert-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={e => { setFile(e.target.files[0]); setResult(null); setError('') }} />

                {file ? (
                  <>
                    {file.type.startsWith('image/') ? <Image size={32} className="text-green-400 mx-auto mb-2" /> : <FileText size={32} className="text-green-400 mx-auto mb-2" />}
                    <p className="font-body font-medium text-white text-sm">{file.name}</p>
                    <p className="font-body text-xs text-slate-400 mt-1">{(file.size/1024).toFixed(0)} KB · Ready to upload</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="font-body text-white text-sm font-medium">Drop certificate here</p>
                    <p className="font-body text-xs text-slate-500 mt-1">PDF, JPG, PNG, WEBP · Max 10MB</p>
                  </>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin"/> Processing...</>
                    : <><Zap size={14}/> Validate & Register</>}
                </button>
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Status */}
              <div className={`p-4 rounded-xl border ${
                result.certificate?.status === 'valid' ? 'bg-green-500/8 border-green-500/20' :
                result.certificate?.status === 'needs_test' ? 'bg-yellow-500/8 border-yellow-500/20' :
                'bg-red-500/8 border-red-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.certificate?.status === 'valid' ? <CheckCircle2 size={20} className="text-green-400"/> : <Clock size={20} className="text-yellow-400"/>}
                  <span className={`font-display font-bold ${result.certificate?.status === 'valid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.certificate?.status === 'valid' ? 'Certificate Validated!' :
                     result.certificate?.status === 'needs_test' ? 'Skill Test Required' : 'Validation Failed'}
                  </span>
                </div>
                {result.certificate?.ai_reason && (
                  <p className="font-body text-sm text-slate-300">{result.certificate.ai_reason}</p>
                )}
              </div>

              {/* AI Confidence */}
              {result.certificate?.ai_confidence > 0 && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-body text-sm text-slate-400">AI Confidence</span>
                    <span className={`font-display font-bold ${confidenceColor(result.certificate.ai_confidence)}`}>
                      {result.certificate.ai_confidence}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${confidenceBg(result.certificate.ai_confidence)}`}
                      style={{ width: `${result.certificate.ai_confidence}%` }} />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2">
                {result.certificate?.ai_course_name && (
                  <div className="flex justify-between"><span className="font-body text-sm text-slate-400">Course</span><span className="font-body text-sm text-white">{result.certificate.ai_course_name}</span></div>
                )}
                {result.certificate?.ai_issuer && (
                  <div className="flex justify-between"><span className="font-body text-sm text-slate-400">Issuer</span><span className="font-body text-sm text-white">{result.certificate.ai_issuer}</span></div>
                )}
              </div>

              {/* Skills */}
              {result.certificate?.ai_skills?.length > 0 && (
                <div>
                  <p className="font-body text-xs text-slate-400 mb-2">Skills Detected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.certificate.ai_skills.map(s => <span key={s} className="badge-cyan text-xs">{s}</span>)}
                  </div>
                </div>
              )}

              {/* Blockchain hash */}
              {result.certificate?.blockchain_tx_hash && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                  <Lock size={14} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-body text-xs text-blue-400 font-medium">Registered on Polygon Blockchain ✓</p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">{result.certificate.blockchain_tx_hash.substring(0,32)}...</p>
                  </div>
                </div>
              )}

              {result.certificate?.status === 'needs_test' && (
                <div className="p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                  <p className="font-body text-sm text-yellow-400 font-medium">AI confidence was 30-69% → Skill test required</p>
                  <p className="font-body text-xs text-slate-400 mt-1">Pass a 5-question MCQ test to get this certificate validated.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setFile(null); setResult(null) }} className="btn-ghost flex-1 py-2.5 text-sm">Upload Another</button>
                <button onClick={() => { onSuccess(result.certificate); onClose() }} className="btn-primary flex-1 py-2.5 text-sm">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Certificates Page ────────────────────────────────────────────────────
export default function CertificatesPage() {
  const [certs,     setCerts]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [expanded,  setExpanded]  = useState(null)

  const fetchCerts = async () => {
    setLoading(true); setError('')
    try {
      // ✅ GET /api/certificates
      const { data } = await certificateAPI.getAll()
      setCerts(data.certificates || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Backend not connected. Run: node server.js')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCerts() }, [])

  const validCount   = certs.filter(c => c.status === 'valid').length
  const pendingCount = certs.filter(c => c.status === 'needs_test').length
  const onChainCount = certs.filter(c => c.blockchain_tx_hash).length

  return (
    <div className="min-h-screen bg-navy-950 pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">
              <span className="text-gradient">AI Certificate</span> Validation
            </h1>
            <p className="font-body text-slate-400 mt-1">GPT-4 validates · OCR extracts · Blockchain registers</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchCerts} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5">
              <RefreshCw size={14}/> Refresh
            </button>
            <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Upload size={15}/> Upload Certificate
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total',          value: loading ? '—' : certs.length,  color: 'bg-slate-500/20',  icon: Award     },
            { label: 'Valid',          value: loading ? '—' : validCount,    color: 'bg-green-500/20',  icon: CheckCircle2 },
            { label: 'Needs Attention',value: loading ? '—' : pendingCount,  color: 'bg-orange-500/20', icon: Clock     },
            { label: 'On Blockchain',  value: loading ? '—' : onChainCount,  color: 'bg-blue-500/20',   icon: Lock      },
          ].map(s => (
            <div key={s.label} className="card py-4">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
                <s.icon size={17} className="text-white" />
              </div>
              <div className="font-display font-bold text-2xl text-white">{s.value}</div>
              <div className="font-body text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
            <button onClick={fetchCerts} className="text-xs text-red-400 flex items-center gap-1">
              <RefreshCw size={12}/> Retry
            </button>
          </div>
        )}

        {/* Certificates list */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-2xl" />)}
          </div>
        ) : certs.length === 0 && !error ? (
          <div className="card text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-cyan-400" />
            </div>
            <h3 className="font-display font-semibold text-xl text-white mb-2">No Certificates Yet</h3>
            <p className="font-body text-slate-400 mb-6 max-w-md mx-auto">
              Upload your first certificate. GPT-4 will validate it, extract your skills, and register it on blockchain.
            </p>
            <button onClick={() => setShowUpload(true)} className="btn-primary">Upload First Certificate</button>
          </div>
        ) : (
          <div className="space-y-4">
            {certs.map(cert => {
              const s = STATUS[cert.status] || STATUS.pending
              return (
                <div key={cert.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Award size={22} className="text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold text-white truncate">
                            {cert.ai_course_name || cert.original_name || 'Certificate'}
                          </h3>
                          <span className={s.cls}><s.icon size={11}/> {s.label}</span>
                          {cert.blockchain_tx_hash && <span className="badge-green text-xs"><Lock size={10}/> On-chain</span>}
                        </div>
                        <p className="font-body text-sm text-slate-400">{cert.ai_issuer || 'Unknown Issuer'}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(cert.ai_skills || []).slice(0,6).map(s => <span key={s} className="badge-cyan text-xs">{s}</span>)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {cert.ai_confidence > 0 && (
                        <div className="text-right">
                          <div className={`font-display font-bold ${cert.ai_confidence >= 70 ? 'text-green-400' : cert.ai_confidence >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {cert.ai_confidence}%
                          </div>
                          <div className="font-body text-xs text-slate-600">AI confidence</div>
                        </div>
                      )}
                      <button
                        onClick={() => setExpanded(expanded === cert.id ? null : cert.id)}
                        className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        Details <ChevronRight size={12} className={`transition-transform ${expanded === cert.id ? 'rotate-90' : ''}`}/>
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded === cert.id && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      {cert.ai_reason && (
                        <div className="p-3 glass rounded-xl">
                          <p className="font-body text-xs text-slate-400 mb-1">AI Assessment</p>
                          <p className="font-body text-sm text-slate-300">{cert.ai_reason}</p>
                        </div>
                      )}
                      {cert.blockchain_tx_hash && (
                        <div className="flex items-center gap-2 p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                          <Lock size={13} className="text-blue-400"/>
                          <div>
                            <p className="font-body text-xs text-blue-400 font-medium">Polygon Blockchain Hash</p>
                            <p className="font-mono text-xs text-slate-500 break-all">{cert.blockchain_tx_hash}</p>
                          </div>
                        </div>
                      )}
                      {cert.status === 'needs_test' && (
                        <div className="flex items-center justify-between p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
                          <p className="font-body text-sm text-yellow-400">Skill verification test needed</p>
                          <Link to={`/verify-test/${cert.id}`} className="btn-primary text-xs py-1.5 px-3">Take Test →</Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={cert => { setCerts(prev => [cert, ...prev]); setShowUpload(false) }}
        />
      )}
    </div>
  )
}
