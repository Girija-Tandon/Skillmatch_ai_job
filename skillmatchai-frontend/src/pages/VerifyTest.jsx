// src/pages/VerifyTest.jsx
// ✅ GET /api/certificates/:id/generate-test → fetch questions
// ✅ POST /api/certificates/:id/verify-test  → submit answers
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { certificateAPI } from '../utils/api'
import {
  Award, CheckCircle2, XCircle, ArrowLeft,
  Loader2, ChevronRight, Trophy, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function VerifyTest() {
  const { certId }  = useParams()
  const navigate    = useNavigate()
  const [questions, setQuestions] = useState([])
  const [answers,   setAnswers]   = useState({})   // { questionId: 'A' }
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')

  // ── Load questions from GET /api/certificates/:id/generate-test ──────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await certificateAPI.generateTest(certId)
        setQuestions(data.questions || [])
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load test questions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [certId])

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id])
  const progress    = questions.length > 0 ? Object.keys(answers).length / questions.length : 0

  // ── Submit to POST /api/certificates/:id/verify-test ─────────────────────
  const handleSubmit = async () => {
    if (!allAnswered) { toast.error('Please answer all questions before submitting'); return }
    setSubmitting(true)
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId, selectedAnswer
      }))
      const { data } = await certificateAPI.submitTest(certId, answerArray)
      setResult(data)
      if (data.passed) toast.success(`Test passed with ${data.score}%! 🎉`)
      else toast.error(`Score: ${data.score}%. Need 70% to pass.`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-3" />
        <p className="font-body text-slate-400">Loading skill test...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="card text-center max-w-md w-full">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <h2 className="font-display font-bold text-xl text-white mb-2">Could Not Load Test</h2>
        <p className="font-body text-slate-400 mb-5">{error}</p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 py-2.5 px-6">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
      </div>
    </div>
  )

  // ── Results Screen ────────────────────────────────────────────────────────
  if (result) return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="card max-w-lg w-full text-center">
        <div className={`w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center
          ${result.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {result.passed
            ? <Trophy size={36} className="text-green-400" />
            : <XCircle size={36} className="text-red-400" />
          }
        </div>

        <h1 className="font-display font-bold text-3xl text-white mb-1">
          {result.passed ? 'Test Passed! 🎉' : 'Test Failed'}
        </h1>
        <p className="font-body text-slate-400 mb-6">
          {result.passed
            ? 'Your certificate is now validated and registered.'
            : 'You need 70% to pass. Try again after reviewing the material.'}
        </p>

        {/* Score */}
        <div className="flex items-center justify-center gap-8 p-5 glass rounded-2xl mb-6">
          <div>
            <div className="font-display font-bold text-4xl text-gradient">{result.score}%</div>
            <div className="font-body text-xs text-slate-500 mt-1">Your Score</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <div className="font-display font-bold text-4xl text-white">{result.correct}/{result.total}</div>
            <div className="font-body text-xs text-slate-500 mt-1">Correct</div>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <div className="font-display font-bold text-4xl text-cyan-400">70%</div>
            <div className="font-body text-xs text-slate-500 mt-1">Pass Mark</div>
          </div>
        </div>

        {/* Per-question results */}
        <div className="space-y-2 mb-6 text-left">
          {(result.results || []).map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border
              ${r.correct ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
              {r.correct
                ? <CheckCircle2 size={15} className="text-green-400 flex-shrink-0" />
                : <XCircle     size={15} className="text-red-400 flex-shrink-0" />
              }
              <span className="font-body text-sm text-slate-300">Question {i + 1}</span>
              {!r.correct && (
                <span className="font-body text-xs text-slate-500 ml-auto">
                  Correct: <span className="text-green-400">{r.correctAnswer}</span>
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link to="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm">
            <Award size={15} /> {result.passed ? 'View Certificate' : 'Back to Dashboard'}
          </Link>
          {!result.passed && (
            <button
              onClick={() => { setResult(null); setAnswers({}) }}
              className="btn-ghost flex-1 py-3 text-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // ── Test Screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-body text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Award size={20} className="text-orange-400" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white">Skill Verification Test</h1>
                <p className="font-body text-xs text-slate-400">Answer {questions.length} questions — need 70% to pass</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-2xl text-white">
                {Object.keys(answers).length}/{questions.length}
              </div>
              <div className="font-body text-xs text-slate-500">answered</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5 mb-6">
          {questions.map((q, i) => (
            <div key={q.id} className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-body text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">Q{i + 1}</span>
                {answers[q.id] && <CheckCircle2 size={14} className="text-green-400" />}
              </div>
              <p className="font-body text-white font-medium mb-5 leading-relaxed">{q.question}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(q.options || {}).map(([key, text]) => (
                  <button
                    key={key}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: key }))}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
                      ${answers[q.id] === key
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/5'
                      }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-sm flex-shrink-0
                      ${answers[q.id] === key ? 'bg-cyan-500 text-navy-950' : 'bg-white/5 text-slate-400'}`}>
                      {key}
                    </span>
                    <span className="font-body text-sm">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50"
        >
          {submitting
            ? <><Loader2 size={18} className="animate-spin" /> Evaluating...</>
            : <><ChevronRight size={18} /> Submit Test ({Object.keys(answers).length}/{questions.length} answered)</>
          }
        </button>

        {!allAnswered && (
          <p className="text-center font-body text-sm text-slate-600 mt-3">
            Answer all {questions.length} questions to submit
          </p>
        )}
      </div>
    </div>
  )
}
