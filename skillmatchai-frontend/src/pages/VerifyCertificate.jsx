// src/pages/VerifyCertificate.jsx — Public blockchain verify, no login needed
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle2, XCircle, Search, Lock, ExternalLink, BrainCircuit } from 'lucide-react'

export default function VerifyCertificate() {
  const [hash,    setHash]    = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    const h = hash.trim()
    if (!h) return
    if (h.length !== 64) {
      setError('Certificate hash must be exactly 64 characters (SHA-256 format)')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      // ✅ GET /api/blockchain/verify/:hash — public endpoint, no auth needed
      const res  = await fetch(`http://localhost:5000/api/blockchain/verify/${h}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Could not connect to backend. Make sure the server is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-16 px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <Shield size={30} className="text-blue-400" />
          </div>
          <h1 className="font-display font-bold text-4xl text-white mb-3">
            Verify Certificate
          </h1>
          <p className="font-body text-slate-400 leading-relaxed">
            Enter a certificate SHA-256 hash to verify its authenticity on the Polygon blockchain.
            This is a public endpoint — no login required.
          </p>
        </div>

        {/* Verify Form */}
        <div className="card mb-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">
                Certificate Hash (SHA-256)
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={hash}
                  onChange={e => { setHash(e.target.value); setError(''); setResult(null) }}
                  placeholder="Enter 64-character SHA-256 hash..."
                  className="input pl-10 font-mono text-sm"
                  maxLength={64}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                {error && <p className="font-body text-xs text-red-400">{error}</p>}
                <p className="font-body text-xs text-slate-600 ml-auto">{hash.length}/64</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || hash.trim().length !== 64}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" /> Querying Blockchain...</>
                : <><Shield size={16} /> Verify on Blockchain</>}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className={`card border-2 ${result.isValid ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
            <div className="flex items-center gap-3 mb-4">
              {result.isValid
                ? <CheckCircle2 size={28} className="text-green-400" />
                : <XCircle     size={28} className="text-red-400" />}
              <div>
                <h3 className={`font-display font-bold text-xl ${result.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {result.isValid ? 'Certificate is VALID ✅' : 'Certificate NOT Found ❌'}
                </h3>
                <p className="font-body text-sm text-slate-400">
                  {result.isValid ? 'This certificate is registered and valid on Polygon blockchain' : 'No record found for this hash on blockchain'}
                </p>
              </div>
            </div>

            {result.isValid && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                {result.certDetails?.courseName && (
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-slate-400">Course</span>
                    <span className="font-body text-sm text-white font-medium">{result.certDetails.courseName}</span>
                  </div>
                )}
                {result.certDetails?.issuer && (
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-slate-400">Issuer</span>
                    <span className="font-body text-sm text-white font-medium">{result.certDetails.issuer}</span>
                  </div>
                )}
                {result.certDetails?.skills?.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="font-body text-sm text-slate-400">Skills</span>
                    <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                      {result.certDetails.skills.map(s => (
                        <span key={s} className="badge-cyan text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {result.date && (
                  <div className="flex justify-between">
                    <span className="font-body text-sm text-slate-400">Registered</span>
                    <span className="font-body text-sm text-white">{new Date(result.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</span>
                  </div>
                )}
                {result.hash && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="font-body text-sm text-slate-400">Hash</span>
                    <span className="font-mono text-xs text-slate-400">{result.hash.substring(0,20)}...{result.hash.substring(60)}</span>
                  </div>
                )}

                {/* PolygonScan link */}
                <a
                  href={`https://mumbai.polygonscan.com/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 mt-2 text-sm text-blue-400 hover:text-blue-300 font-body"
                >
                  <ExternalLink size={13} /> View on PolygonScan
                </a>
              </div>
            )}
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 p-4 glass rounded-xl border border-white/5">
          <h4 className="font-body text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Lock size={14} className="text-cyan-400" /> How Certificate Hashing Works
          </h4>
          <p className="font-body text-xs text-slate-500 leading-relaxed">
            When a certificate is validated by our AI, we generate a SHA-256 hash of the original file
            and register it on the Polygon blockchain. The hash is unique to that exact file — even
            one changed pixel produces a completely different hash. This makes forgery impossible.
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="font-body text-sm text-slate-500">
            Want to get your own certificates validated?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300">Create a free account →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
