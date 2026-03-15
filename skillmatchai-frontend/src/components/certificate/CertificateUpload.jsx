// src/components/certificate/CertificateUpload.jsx
// ✅ Calls POST /api/certificates → AI validates → blockchain registers
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { certificateAPI } from '../../utils/api'
import {
  Upload, X, FileText, Image, CheckCircle2, XCircle,
  Lock, Loader2, AlertTriangle, Award, ChevronRight, Zap
} from 'lucide-react'

export default function CertificateUpload({ onClose, onSuccess }) {
  const [file,    setFile]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')
  const [stage,   setStage]   = useState('upload') // upload | processing | done

  const onDrop = useCallback(accepted => {
    if (accepted[0]) { setFile(accepted[0]); setResult(null); setError('') }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rej) => {
      if (rej[0]?.errors[0]?.code === 'file-too-large') setError('File too large — max 10MB')
      else setError('Only PDF, JPG, PNG, WEBP files are accepted')
    }
  })

  // Processing steps shown during upload
  const steps = [
    { label: 'Uploading file...',              done: stage !== 'upload' },
    { label: 'Extracting text (OCR)...',       done: result !== null },
    { label: 'AI validation (GPT-4)...',       done: result !== null },
    { label: 'Registering on blockchain...',   done: result?.certificate?.blockchain_tx_hash },
  ]

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setStage('processing')

    try {
      // ✅ POST /api/certificates — multipart form upload
      const { data } = await certificateAPI.upload(file)
      setResult(data)
      setStage('done')
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Make sure backend is running.'
      setError(msg)
      setStage('upload')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    valid:      'border-green-500/30 bg-green-500/5',
    needs_test: 'border-orange-500/30 bg-orange-500/5',
    invalid:    'border-red-500/30 bg-red-500/5',
  }

  const statusIcon = {
    valid:      <CheckCircle2 size={20} className="text-green-400" />,
    needs_test: <AlertTriangle size={20} className="text-orange-400" />,
    invalid:    <XCircle size={20} className="text-red-400" />,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Award size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">Upload Certificate</h2>
              <p className="font-body text-xs text-slate-400">AI validates + Blockchain registers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Processing Stage */}
          {stage === 'processing' && (
            <div className="space-y-3">
              <p className="font-body text-sm text-slate-400 text-center mb-4">
                Processing your certificate... this takes 10–30 seconds
              </p>
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl">
                  {step.done
                    ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                    : i === steps.findIndex(s => !s.done)
                      ? <Loader2 size={16} className="text-cyan-400 animate-spin flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                  }
                  <span className={`font-body text-sm ${step.done ? 'text-green-400' : i === steps.findIndex(s => !s.done) ? 'text-white' : 'text-slate-600'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upload Stage */}
          {stage === 'upload' && (
            <>
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                  ${isDragActive
                    ? 'border-cyan-500 bg-cyan-500/5'
                    : file
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/5'
                  }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    {file.type === 'application/pdf'
                      ? <FileText size={28} className="text-cyan-400" />
                      : <Image size={28} className="text-cyan-400" />
                    }
                    <div className="text-left">
                      <p className="font-body font-medium text-white text-sm">{file.name}</p>
                      <p className="font-body text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null) }}
                      className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="text-slate-600 mx-auto mb-3" />
                    <p className="font-body text-slate-300 font-medium mb-1">
                      {isDragActive ? 'Drop it here!' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="font-body text-xs text-slate-500">PDF, JPG, PNG, WEBP — max 10MB</p>
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: Upload, label: 'Upload', color: 'text-cyan-400' },
                  { icon: Zap,    label: 'AI Validates', color: 'text-purple-400' },
                  { icon: Lock,   label: 'Blockchain', color: 'text-green-400' },
                ].map(s => (
                  <div key={s.label} className="p-3 glass rounded-xl">
                    <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                    <p className="font-body text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <XCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1 py-3 text-sm">Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50"
                >
                  <Zap size={15} /> Validate Certificate
                </button>
              </div>
            </>
          )}

          {/* Done Stage — Show Results */}
          {stage === 'done' && result && (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${statusColor[result.certificate?.status] || statusColor.invalid}`}>
                {statusIcon[result.certificate?.status] || statusIcon.invalid}
                <div>
                  <p className="font-display font-bold text-white">{result.message}</p>
                  <p className="font-body text-xs text-slate-400 mt-0.5">
                    AI Confidence: <span className="text-white font-medium">{result.aiResult?.confidence || 0}%</span>
                  </p>
                </div>
              </div>

              {/* Certificate Details */}
              {result.aiResult && (
                <div className="space-y-3">
                  {result.aiResult.courseName && (
                    <div className="p-3 glass rounded-xl">
                      <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-1">Course / Certificate</p>
                      <p className="font-body text-white font-medium">{result.aiResult.courseName}</p>
                    </div>
                  )}
                  {result.aiResult.issuer && (
                    <div className="p-3 glass rounded-xl">
                      <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-1">Issued By</p>
                      <p className="font-body text-white">{result.aiResult.issuer}</p>
                    </div>
                  )}
                  {result.aiResult.skills?.length > 0 && (
                    <div className="p-3 glass rounded-xl">
                      <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-2">Skills Detected</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.aiResult.skills.map(s => (
                          <span key={s} className="badge-cyan text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Blockchain Registration */}
              {result.certificate?.blockchain_tx_hash && (
                <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <Lock size={14} className="text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-body text-xs text-green-400 font-medium">Registered on Polygon Blockchain</p>
                    <p className="font-mono text-xs text-slate-500 truncate">{result.certificate.blockchain_tx_hash}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {result.certificate?.status === 'needs_test' ? (
                  <a
                    href={`/verify-test/${result.certificate.id}`}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm"
                  >
                    Take Skill Test <ChevronRight size={14} />
                  </a>
                ) : (
                  <button
                    onClick={() => onSuccess && onSuccess(result.certificate)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm"
                  >
                    <CheckCircle2 size={15} /> Done
                  </button>
                )}
                <button
                  onClick={() => { setFile(null); setResult(null); setStage('upload') }}
                  className="btn-ghost flex-1 py-3 text-sm"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
