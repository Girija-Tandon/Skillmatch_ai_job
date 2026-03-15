// src/pages/BlockchainVerify.jsx
// ✅ GET /api/blockchain/verify/:hash — public, no login needed
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { blockchainAPI } from '../utils/api'
import {
  Lock, CheckCircle2, XCircle, Search, Shield,
  ExternalLink, Copy, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function BlockchainVerify() {
  const { hash: urlHash }  = useParams()
  const [hash,    setHash]    = useState(urlHash || '')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Auto-search if hash is in URL
  useEffect(() => {
    if (urlHash && urlHash.length === 64) verify(urlHash)
  }, [])

  const verify = async (h = hash) => {
    const cleanHash = h.trim()
    if (cleanHash.length !== 64) {
      setError('Certificate hash must be exactly 64 characters (SHA-256)')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      // ✅ GET /api/blockchain/verify/:hash
      const { data } = await blockchainAPI.verify(cleanHash)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Backend may not be running.')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-body text-sm mb-8 transition-colors">
          <ArrowLeft size={15} /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-cyan-400" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Blockchain Certificate Verifier</h1>
          <p className="font-body text-slate-400">
            Enter a certificate hash to verify its authenticity on the Polygon blockchain.
            <br />Anyone can verify — no account needed.
          </p>
        </div>

        {/* Search Card */}
        <div className="card mb-6">
          <label className="block font-body text-sm text-slate-400 mb-2">Certificate Hash (SHA-256)</label>
          <div className="flex gap-3">
            <input
              value={hash}
              onChange={e => setHash(e.target.value)}
              placeholder="e.g. a3f4b2c1d0e9f8... (64 characters)"
              className="input flex-1 font-mono text-sm"
              onKeyDown={e => e.key === 'Enter' && verify()}
            />
            <button
              onClick={() => verify()}
              disabled={loading || !hash.trim()}
              className="btn-primary flex items-center gap-2 px-5 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Verify
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="card text-center py-12">
            <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="font-body text-slate-400">Querying Polygon blockchain...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className={`card border-2 ${result.isValid ? 'border-green-500/30' : 'border-red-500/30'}`}>
            {/* Status */}
            <div className={`flex items-center gap-4 p-4 rounded-xl mb-5
              ${result.isValid ? 'bg-green-500/8' : 'bg-red-500/8'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                ${result.isValid ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {result.isValid
                  ? <CheckCircle2 size={28} className="text-green-400" />
                  : <XCircle size={28} className="text-red-400" />
                }
              </div>
              <div>
                <h2 className={`font-display font-bold text-2xl ${result.isValid ? 'text-green-400' : 'text-red-400'}`}>
                  {result.isValid ? 'Certificate Valid ✅' : 'Certificate Not Found ❌'}
                </h2>
                <p className="font-body text-sm text-slate-400">
                  {result.isValid
                    ? 'This certificate is registered and verified on the Polygon blockchain.'
                    : 'No record of this certificate was found on the blockchain.'}
                </p>
              </div>
            </div>

            {/* Details */}
            {result.isValid && (
              <div className="space-y-3">
                {result.certDetails?.courseName && (
                  <div className="flex items-start justify-between p-3 glass rounded-xl">
                    <span className="font-body text-xs text-slate-500 uppercase tracking-wider">Course</span>
                    <span className="font-body text-sm text-white font-medium">{result.certDetails.courseName}</span>
                  </div>
                )}
                {result.certDetails?.issuer && (
                  <div className="flex items-start justify-between p-3 glass rounded-xl">
                    <span className="font-body text-xs text-slate-500 uppercase tracking-wider">Issuer</span>
                    <span className="font-body text-sm text-white">{result.certDetails.issuer}</span>
                  </div>
                )}
                {result.date && (
                  <div className="flex items-start justify-between p-3 glass rounded-xl">
                    <span className="font-body text-xs text-slate-500 uppercase tracking-wider">Registered On</span>
                    <span className="font-body text-sm text-white">{new Date(result.date).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}</span>
                  </div>
                )}
                {result.certDetails?.skills?.length > 0 && (
                  <div className="p-3 glass rounded-xl">
                    <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-2">Skills Validated</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.certDetails.skills.map(s => <span key={s} className="badge-cyan text-xs">{s}</span>)}
                    </div>
                  </div>
                )}
                {/* Hash with copy */}
                <div className="p-3 glass rounded-xl">
                  <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-1">Certificate Hash</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-slate-400 break-all flex-1">{result.hash}</p>
                    <button onClick={() => copy(result.hash)} className="text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                {/* Polygon explorer link */}
                {result.userId && (
                  <a
                    href={`https://mumbai.polygonscan.com/address/${result.userId}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-purple-400 hover:text-purple-300 font-body text-sm transition-colors"
                  >
                    <ExternalLink size={14} /> View on PolygonScan
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info section */}
        {!result && !loading && (
          <div className="card">
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={16} className="text-cyan-400" /> How Blockchain Verification Works
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'When a certificate is uploaded and validated, its SHA-256 hash is computed.' },
                { step: '2', text: 'The hash is stored permanently on the Polygon blockchain — tamper-proof forever.' },
                { step: '3', text: 'Anyone can verify a certificate by entering its hash here — no account needed.' },
                { step: '4', text: 'If the hash matches, the certificate is genuine. If not, it may be fake or modified.' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="font-display font-bold text-xs text-cyan-400">{item.step}</span>
                  </div>
                  <p className="font-body text-sm text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
