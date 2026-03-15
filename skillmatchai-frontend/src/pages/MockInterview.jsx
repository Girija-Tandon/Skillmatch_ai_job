// src/pages/MockInterview.jsx
// ✅ POST /api/interviews/start       → generate 5 GPT-4 questions
// ✅ POST /api/interviews/:id/answer  → evaluate each answer with GPT-4
// ✅ GET  /api/interviews/:id/results → final score breakdown
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { interviewAPI } from '../utils/api'
import {
  Mic, MicOff, ChevronRight, ArrowLeft, Trophy,
  CheckCircle2, XCircle, Star, Loader2, RotateCcw,
  Play, StopCircle, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_SUGGESTIONS = ['Full Stack Developer','Frontend Developer','Data Scientist','DevOps Engineer','Python Developer','React Developer','Backend Engineer']
const DIFF_COLORS = { easy:'text-green-400 bg-green-500/10 border-green-500/20', medium:'text-orange-400 bg-orange-500/10 border-orange-500/20', hard:'text-red-400 bg-red-500/10 border-red-500/20' }

export default function MockInterview() {
  const [stage, setStage] = useState('setup')      // setup | interview | result
  const [role, setRole]   = useState('')
  const [interviewId, setInterviewId] = useState(null)
  const [questions, setQuestions]     = useState([])
  const [currentQ, setCurrentQ]       = useState(0)
  const [answer, setAnswer]           = useState('')
  const [evaluation, setEvaluation]   = useState(null)
  const [allEvals, setAllEvals]       = useState([])
  const [results, setResults]         = useState(null)
  const [loading, setLoading]         = useState(false)
  const [recording, setRecording]     = useState(false)
  const [error, setError]             = useState('')
  const recognitionRef = useRef(null)

  // ── Start Interview ────────────────────────────────────────────────────────
  const startInterview = async () => {
    if (!role.trim()) { toast.error('Enter a target role first'); return }
    setLoading(true); setError('')
    try {
      const { data } = await interviewAPI.start(role)   // POST /api/interviews/start
      setInterviewId(data.interviewId)
      setQuestions(data.questions)
      setCurrentQ(0); setAllEvals([]); setEvaluation(null)
      setStage('interview')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start interview. Is backend + OpenAI running?')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit Answer ─────────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!answer.trim()) { toast.error('Please provide an answer'); return }
    setLoading(true)
    try {
      const q = questions[currentQ]
      // POST /api/interviews/:id/answer
      const { data } = await interviewAPI.submitAnswer(interviewId, q.id, answer)
      setEvaluation(data.evaluation)
      setAllEvals(prev => [...prev, data.evaluation])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Evaluation failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Next Question ─────────────────────────────────────────────────────────
  const nextQuestion = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
      setAnswer(''); setEvaluation(null)
    } else {
      // Done — fetch final results
      setLoading(true)
      try {
        const { data } = await interviewAPI.getResults(interviewId)  // GET /api/interviews/:id/results
        setResults(data)
        setStage('result')
      } catch (err) {
        toast.error('Could not load results')
      } finally {
        setLoading(false)
      }
    }
  }

  // ── Voice recording ───────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice not supported in this browser. Use Chrome.')
      return
    }
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setAnswer(t)
    }
    recognition.onend = () => setRecording(false)
    recognition.start()
    setRecording(true)
  }

  const ScoreRing = ({ score }) => {
    const r=36, c=2*Math.PI*r, pct=(score/10)*c
    const color = score>=8?'#10B981':score>=6?'#F59E0B':'#EF4444'
    return (
      <div className="relative w-24 h-24 mx-auto">
        <svg className="transform -rotate-90" width="96" height="96">
          <circle cx="48" cy="48" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none"/>
          <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="8" fill="none"
            strokeDasharray={`${pct} ${c}`} strokeLinecap="round" style={{transition:'all 1s ease'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-2xl text-white">{score}</span>
          <span className="font-body text-xs text-slate-500">/10</span>
        </div>
      </div>
    )
  }

  // ─── SETUP SCREEN ────────────────────────────────────────────────────────
  if (stage === 'setup') return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-body text-sm mb-8 transition-colors">
          <ArrowLeft size={15}/> Back
        </Link>
        <div className="card">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mb-5">
            <Mic size={26} className="text-green-400"/>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Mock Interview</h1>
          <p className="font-body text-slate-400 mb-6">GPT-4 generates role-specific questions, evaluates your answers, and gives detailed feedback.</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-body text-sm text-slate-400 mb-2">Target Role</label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                onKeyDown={e => e.key==='Enter' && startInterview()}
                placeholder="e.g. Senior React Developer"
                className="input w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_SUGGESTIONS.map(r => (
                <button key={r} onClick={() => setRole(r)} className={`px-3 py-1.5 rounded-xl border font-body text-xs transition-all ${role===r?'border-cyan-500 bg-cyan-500/10 text-cyan-400':'border-white/10 text-slate-400 hover:border-white/25'}`}>{r}</button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400"/>
              <p className="font-body text-sm text-red-400">{error}</p>
            </div>
          )}

          <button onClick={startInterview} disabled={!role.trim()||loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50">
            {loading ? <><Loader2 size={18} className="animate-spin"/> Generating Questions...</> : <><Play size={18}/> Start Interview</>}
          </button>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[['5','Questions'],['GPT-4','Evaluator'],['Instant','Feedback']].map(([v,l]) => (
              <div key={l} className="p-2.5 glass rounded-xl">
                <div className="font-display font-bold text-lg text-cyan-400">{v}</div>
                <div className="font-body text-xs text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ─── INTERVIEW SCREEN ────────────────────────────────────────────────────
  if (stage === 'interview') {
    const q = questions[currentQ]
    const prog = ((currentQ + (evaluation ? 1 : 0)) / questions.length) * 100
    return (
      <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-body text-xs text-slate-500">Role: <span className="text-white">{role}</span></p>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-xl text-white">{currentQ+1}</span>
                <span className="font-body text-slate-500 text-sm">/{questions.length}</span>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700" style={{width:`${prog}%`}}/>
            </div>
          </div>

          {/* Question */}
          {q && (
            <div className="card mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-lg border text-xs font-body font-medium ${DIFF_COLORS[q.difficulty||'medium']}`}>
                  {q.difficulty||'medium'}
                </span>
                <span className="font-body text-xs text-slate-500">Question {currentQ+1}</span>
              </div>
              <p className="font-body text-white text-lg leading-relaxed">{q.question}</p>
            </div>
          )}

          {/* Answer Input */}
          {!evaluation && (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="font-body text-sm text-slate-400">Your Answer</label>
                <button onClick={toggleVoice} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-body transition-all ${recording?'border-red-500 bg-red-500/10 text-red-400':'border-white/10 text-slate-400 hover:border-white/25'}`}>
                  {recording ? <><MicOff size={12}/> Stop</> : <><Mic size={12}/> Voice</>}
                </button>
              </div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here, or use the microphone to speak..."
                className="input w-full resize-none text-sm"
                rows={5}
              />
              {recording && <p className="font-body text-xs text-red-400 mt-1.5 flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"/>Recording...</p>}
              <button onClick={submitAnswer} disabled={!answer.trim()||loading} className="btn-primary w-full mt-3 flex items-center justify-center gap-2 py-3 disabled:opacity-50">
                {loading ? <><Loader2 size={16} className="animate-spin"/> Evaluating with GPT-4...</> : <><ChevronRight size={16}/> Submit Answer</>}
              </button>
            </div>
          )}

          {/* Evaluation */}
          {evaluation && (
            <div className="card mb-4 border border-white/10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-white text-lg">AI Feedback</h3>
                <ScoreRing score={evaluation.score||0}/>
              </div>
              <p className="font-body text-slate-300 text-sm mb-4 leading-relaxed">{evaluation.feedback}</p>

              {evaluation.coveredPoints?.length > 0 && (
                <div className="mb-3">
                  <p className="font-body text-xs text-green-400 uppercase tracking-wider mb-2">✅ What you covered well</p>
                  <ul className="space-y-1">
                    {evaluation.coveredPoints.map((p,i) => <li key={i} className="font-body text-sm text-slate-400 flex items-start gap-2"><CheckCircle2 size={13} className="text-green-400 mt-0.5 flex-shrink-0"/>{p}</li>)}
                  </ul>
                </div>
              )}
              {evaluation.missedPoints?.length > 0 && (
                <div className="mb-3">
                  <p className="font-body text-xs text-orange-400 uppercase tracking-wider mb-2">⚠️ What you missed</p>
                  <ul className="space-y-1">
                    {evaluation.missedPoints.map((p,i) => <li key={i} className="font-body text-sm text-slate-400 flex items-start gap-2"><XCircle size={13} className="text-orange-400 mt-0.5 flex-shrink-0"/>{p}</li>)}
                  </ul>
                </div>
              )}
              {evaluation.suggestion && (
                <div className="p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl mt-3">
                  <p className="font-body text-xs text-cyan-400 uppercase tracking-wider mb-1">💡 Suggestion</p>
                  <p className="font-body text-sm text-slate-300">{evaluation.suggestion}</p>
                </div>
              )}
              <button onClick={nextQuestion} className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3">
                {currentQ < questions.length - 1 ? <><ChevronRight size={16}/> Next Question</> : <><Trophy size={16}/> View Results</>}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── RESULTS SCREEN ───────────────────────────────────────────────────────
  if (stage === 'result' && results) {
    const avg = results.averageScore || 0
    const stars = Math.round(avg / 2)
    return (
      <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Trophy size={36} className="text-yellow-400"/>
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">Interview Complete!</h1>
            <p className="font-body text-slate-400 mb-5">Role: <span className="text-white">{role}</span></p>

            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} size={24} className={i<=stars?'text-yellow-400 fill-yellow-400':'text-slate-700'}/>)}
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 glass rounded-2xl mb-5">
              <div><div className="font-display font-bold text-3xl text-gradient">{avg.toFixed(1)}</div><div className="font-body text-xs text-slate-500">Avg Score/10</div></div>
              <div><div className="font-display font-bold text-3xl text-white">{results.totalQuestions||questions.length}</div><div className="font-body text-xs text-slate-500">Questions</div></div>
              <div><div className="font-display font-bold text-3xl text-cyan-400">{avg>=7?'Pass':'Improve'}</div><div className="font-body text-xs text-slate-500">Assessment</div></div>
            </div>

            <div className="space-y-2 text-left mb-5">
              {(results.questionResults||allEvals).map((r,i) => (
                <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-display font-bold text-sm text-slate-400">Q{i+1}</div>
                  <p className="font-body text-sm text-slate-300 flex-1 truncate">{questions[i]?.question?.slice(0,60)}...</p>
                  <div className={`font-display font-bold text-lg ${r.score>=8?'text-green-400':r.score>=6?'text-orange-400':'text-red-400'}`}>{r.score||r}/10</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Link to="/dashboard" className="btn-ghost flex-1 py-3 text-sm flex items-center justify-center gap-2"><ArrowLeft size={14}/> Dashboard</Link>
              <button onClick={() => {setStage('setup');setRole('');setAnswer('');setEvaluation(null);setAllEvals([]);}} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2"><RotateCcw size={14}/> Try Again</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
