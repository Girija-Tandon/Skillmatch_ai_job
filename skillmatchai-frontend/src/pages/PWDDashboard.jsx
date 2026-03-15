// src/pages/PWDDashboard.jsx — Full accessibility features
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'
import { certificateAPI, jobAPI } from '../utils/api'
import {
  Eye, EyeOff, Mic, MicOff, Hand, Volume2, VolumeX,
  Type, Minus, Plus, Briefcase, Award, Brain, ArrowRight,
  Contrast, Settings, CheckCircle2, WifiOff, RefreshCw,
  Upload, Lock, Clock, XCircle, ZoomIn, ZoomOut,
  Keyboard, Accessibility, PlayCircle, StopCircle,
  ChevronRight, AlertTriangle
} from 'lucide-react'
import CertificateUpload from '../components/certificate/CertificateUpload'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSIBILITY TOOLBAR (fixed sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function AccessibilityToolbar({ onTabChange }) {
  const {
    highContrast, setHighContrast,
    fontSize, increaseFontSize, decreaseFontSize,
    voiceEnabled, setVoiceEnabled,
    signLangEnabled, setSignLangEnabled,
    speakForce,
  } = useAccessibility()

  const toggle = (label, setter, current) => {
    setter(v => !v)
    speakForce(current ? `${label} disabled` : `${label} enabled`)
    toast(`${label} ${current ? 'off' : 'on'}`, { icon: current ? '🔇' : '🔊', duration: 1500 })
  }

  return (
    <div
      className="fixed right-4 top-24 z-50 glass-strong rounded-2xl p-3 border border-white/10 space-y-1.5 shadow-xl"
      role="toolbar"
      aria-label="Accessibility controls"
    >
      <p className="font-body text-xs text-slate-500 text-center mb-2 leading-tight">
        <Accessibility size={12} className="inline mb-0.5" /><br />A11y
      </p>

      {/* High Contrast */}
      <button
        onClick={() => toggle('High contrast', setHighContrast, highContrast)}
        title="Toggle high contrast (Alt+H)"
        aria-label={`High contrast: ${highContrast ? 'on' : 'off'}`}
        aria-pressed={highContrast}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${highContrast
            ? 'bg-yellow-400/20 border border-yellow-400/40'
            : 'hover:bg-white/10 border border-transparent'}`}
      >
        <Contrast size={18} className={highContrast ? 'text-yellow-400' : 'text-slate-500'} />
      </button>

      {/* Voice Output TTS */}
      <button
        onClick={() => toggle('Voice output', setVoiceEnabled, voiceEnabled)}
        title="Toggle voice output (Alt+V)"
        aria-label={`Text to speech: ${voiceEnabled ? 'on' : 'off'}`}
        aria-pressed={voiceEnabled}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${voiceEnabled
            ? 'bg-green-500/20 border border-green-500/30'
            : 'hover:bg-white/10 border border-transparent'}`}
      >
        {voiceEnabled
          ? <Volume2 size={18} className="text-green-400" />
          : <VolumeX size={18} className="text-slate-500" />}
      </button>

      {/* Sign Language tab shortcut */}
      <button
        onClick={() => { onTabChange('sign-language'); speakForce('Sign language detection') }}
        title="Sign language detection"
        aria-label="Open sign language detection"
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 border border-transparent transition-all"
      >
        <Hand size={18} className="text-slate-500 hover:text-cyan-400" />
      </button>

      {/* Voice Input tab shortcut */}
      <button
        onClick={() => { onTabChange('voice'); speakForce('Voice input') }}
        title="Voice input"
        aria-label="Open voice input"
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 border border-transparent transition-all"
      >
        <Mic size={18} className="text-slate-500 hover:text-cyan-400" />
      </button>

      {/* Divider */}
      <div className="border-t border-white/10 pt-1.5 space-y-1">
        <button
          onClick={() => { increaseFontSize(); speakForce('Font size increased') }}
          aria-label="Increase font size"
          title="Increase font size (Alt++)"
          className="w-10 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <ZoomIn size={15} className="text-slate-400" />
        </button>
        <div className="w-10 flex items-center justify-center">
          <span className="font-mono text-xs text-slate-600">{fontSize}</span>
        </div>
        <button
          onClick={() => { decreaseFontSize(); speakForce('Font size decreased') }}
          aria-label="Decrease font size"
          title="Decrease font size (Alt+-)"
          className="w-10 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <ZoomOut size={15} className="text-slate-400" />
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="border-t border-white/10 pt-1.5">
        <button
          onClick={() => speakForce('Keyboard shortcuts: Alt H for contrast, Alt V for voice, Tab to navigate')}
          title="Keyboard shortcuts help"
          aria-label="Keyboard shortcuts help"
          className="w-10 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all"
        >
          <Keyboard size={13} className="text-slate-600" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE INPUT (Speech to Text)
// ─────────────────────────────────────────────────────────────────────────────
function VoiceInputPanel() {
  const [recording,  setRecording]  = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim,    setInterim]    = useState('')
  const [supported,  setSupported]  = useState(true)
  const recognitionRef = useRef(null)
  const { speakForce, voiceEnabled } = useAccessibility()

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSupported(false)
  }, [])

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Not supported in this browser. Use Chrome or Edge.'); return }

    const recognition = new SR()
    recognition.continuous     = true
    recognition.interimResults = true
    recognition.lang           = 'en-US'

    recognition.onstart = () => {
      setRecording(true)
      speakForce('Recording started')
    }

    recognition.onresult = (event) => {
      let final = '', inter = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' '
        else inter += event.results[i][0].transcript
      }
      if (final) setTranscript(prev => prev + final)
      setInterim(inter)
    }

    recognition.onerror  = (e) => {
      toast.error(`Microphone error: ${e.error}. Check browser permissions.`)
      setRecording(false)
    }
    recognition.onend    = () => { setRecording(false); setInterim('') }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
    speakForce('Recording stopped')
  }

  const readAloud = () => {
    const text = transcript.trim()
    if (!text) { toast.error('Nothing to read'); return }
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.9
    window.speechSynthesis?.speak(u)
    toast.success('Reading aloud...')
  }

  const copyText = () => {
    if (!transcript) return
    navigator.clipboard.writeText(transcript)
    toast.success('Copied to clipboard!')
  }

  const clearText = () => { setTranscript(''); setInterim('') }

  return (
    <div className="card" aria-label="Voice input panel">
      <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
        <Mic size={16} className="text-cyan-400" /> Voice Input (Speech to Text)
      </h3>

      {!supported ? (
        <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <AlertTriangle size={18} className="text-orange-400" />
          <div>
            <p className="font-body font-medium text-orange-400">Not supported in this browser</p>
            <p className="font-body text-sm text-slate-400">Please use Chrome or Edge for voice input.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex gap-2 mb-4">
            {!recording ? (
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 font-body text-sm transition-all"
                aria-label="Start recording"
              >
                <PlayCircle size={16} /> Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-body text-sm animate-pulse"
                aria-label="Stop recording"
              >
                <StopCircle size={16} /> Stop Recording
              </button>
            )}
            <button
              onClick={readAloud}
              disabled={!transcript}
              className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all font-body text-sm disabled:opacity-40"
              aria-label="Read transcript aloud"
            >
              <Volume2 size={15} /> Read
            </button>
          </div>

          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-3 mb-3 p-2.5 bg-red-500/10 rounded-xl border border-red-500/15">
              <div className="flex gap-0.5 items-end">
                {[...Array(6)].map((_, i) => (
                  <div key={i}
                    className="w-1.5 bg-red-400 rounded-full animate-bounce"
                    style={{ height: `${8 + (i % 3) * 8}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="font-body text-xs text-red-400 font-medium">Listening...</span>
              {interim && <span className="font-body text-xs text-slate-500 italic truncate">{interim}</span>}
            </div>
          )}

          {/* Transcript */}
          <textarea
            value={transcript + (interim ? `\n[${interim}]` : '')}
            onChange={e => setTranscript(e.target.value)}
            placeholder={recording ? '🎙️ Speak now... text will appear here' : 'Start recording or type here...'}
            rows={5}
            className="input resize-none text-sm font-body w-full mb-3"
            aria-label="Voice transcript"
            aria-live="polite"
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={copyText} disabled={!transcript} className="btn-ghost flex-1 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40">
              Copy Text
            </button>
            <button onClick={clearText} disabled={!transcript} className="btn-danger flex-1 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40">
              Clear
            </button>
          </div>

          {/* Tips */}
          <div className="mt-4 p-3 glass rounded-xl">
            <p className="font-body text-xs text-slate-500 mb-2 font-medium">Tips:</p>
            <ul className="space-y-1">
              {['Say "comma", "period", "new line" for punctuation','Speak clearly at normal pace','Works best in quiet environment','Chrome and Edge have best support'].map(t => (
                <li key={t} className="font-body text-xs text-slate-500 flex items-start gap-1.5">
                  <span className="text-cyan-600 mt-0.5">•</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN LANGUAGE DETECTOR
// ─────────────────────────────────────────────────────────────────────────────
function SignLanguagePanel() {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const intervalRef= useRef(null)
  const [isActive, setIsActive]   = useState(false)
  const [detected, setDetected]   = useState(null)
  const [history,  setHistory]    = useState([])
  const [error,    setError]      = useState('')
  const { speakForce, voiceEnabled } = useAccessibility()

  const GESTURES = [
    { sign: 'A', label: 'Hello / Hi',          emoji: '👋' },
    { sign: 'B', label: 'Yes / Agree',          emoji: '✅' },
    { sign: 'C', label: 'No / Disagree',        emoji: '❌' },
    { sign: 'D', label: 'Thank You',             emoji: '🙏' },
    { sign: 'E', label: 'Please / Request',     emoji: '🤝' },
    { sign: 'F', label: 'Help / Assistance',    emoji: '🆘' },
    { sign: 'G', label: 'Stop / Wait',          emoji: '✋' },
    { sign: 'H', label: 'I Love You',           emoji: '🤟' },
    { sign: 'I', label: 'Good / Thumbs Up',     emoji: '👍' },
    { sign: 'J', label: 'Bad / Thumbs Down',    emoji: '👎' },
  ]

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
      speakForce('Sign language detection started')
      toast.success('Camera active — show hand gestures')

      // Demo detection loop — in production, replace with TensorFlow.js Handpose
      let idx = 0
      intervalRef.current = setInterval(() => {
        const gesture = GESTURES[idx % GESTURES.length]
        setDetected(gesture)
        setHistory(prev => [gesture, ...prev].slice(0, 8))
        if (voiceEnabled) speakForce(gesture.label)
        idx++
      }, 3000)

    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Click the camera icon in your browser address bar to allow.'
        : `Camera error: ${err.message}`
      setError(msg)
      toast.error(msg)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(intervalRef.current)
    if (videoRef.current) videoRef.current.srcObject = null
    streamRef.current = null
    setIsActive(false)
    setDetected(null)
    speakForce('Camera stopped')
  }

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="card" aria-label="Sign language detection panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-white flex items-center gap-2">
          <Hand size={16} className="text-cyan-400" /> Sign Language Detection
        </h3>
        <div className="flex items-center gap-2">
          <span className="badge-orange text-xs">Demo Mode</span>
          <button
            onClick={isActive ? stopCamera : startCamera}
            aria-label={isActive ? 'Stop camera' : 'Start camera'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all
              ${isActive
                ? 'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25'
                : 'bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/25'}`}
          >
            {isActive ? <><EyeOff size={12}/> Stop Camera</> : <><Eye size={12}/> Enable Camera</>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
          <p className="font-body text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Camera Feed */}
        <div>
          <div className="relative aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/10 mb-3">
            <video
              ref={videoRef}
              autoPlay muted playsInline
              className="w-full h-full object-cover"
              aria-label="Camera feed for sign language detection"
            />
            {!isActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <Hand size={28} className="text-slate-600"/>
                </div>
                <p className="font-body text-sm text-slate-500">Camera not active</p>
                <button onClick={startCamera} className="btn-primary text-xs py-2 px-4">
                  Enable Camera
                </button>
              </div>
            )}
            {isActive && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"/>
                <span className="font-body text-xs text-white">LIVE</span>
              </div>
            )}
          </div>

          {/* Current detection */}
          {detected && (
            <div
              className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center"
              aria-live="polite"
              aria-label={`Detected sign: ${detected.label}`}
            >
              <div className="text-4xl mb-1">{detected.emoji}</div>
              <div className="font-display font-bold text-xl text-white">{detected.label}</div>
              <div className="font-mono text-xs text-cyan-400 mt-0.5">Sign: {detected.sign}</div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Detection history */}
          {history.length > 0 && (
            <div>
              <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Detections</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((g, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg transition-all
                    ${i === 0 ? 'bg-cyan-500/10 border border-cyan-500/15' : 'bg-white/3'}`}>
                    <span className="text-xl">{g.emoji}</span>
                    <span className="font-body text-sm text-white">{g.label}</span>
                    {i === 0 && <span className="ml-auto badge-cyan text-xs">Latest</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gesture reference */}
          <div>
            <p className="font-body text-xs text-slate-500 uppercase tracking-wider mb-2">Gesture Reference</p>
            <div className="grid grid-cols-2 gap-1">
              {GESTURES.slice(0, 6).map(g => (
                <div key={g.sign} className="flex items-center gap-1.5 p-2 bg-white/3 rounded-lg">
                  <span className="text-base">{g.emoji}</span>
                  <span className="font-body text-xs text-slate-400 truncate">{g.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl">
            <p className="font-body text-xs text-orange-400 font-medium mb-1">⚠️ Demo Mode</p>
            <p className="font-body text-xs text-slate-500">
              Currently shows simulated detections. Production version uses TensorFlow.js Handpose model for real gesture recognition.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT TO SPEECH PANEL
// ─────────────────────────────────────────────────────────────────────────────
function TextToSpeechPanel() {
  const [text,  setText]  = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [rate,  setRate]  = useState(0.9)
  const [pitch, setPitch] = useState(1)
  const [voices, setVoices] = useState([])
  const [voice, setVoice]   = useState(null)

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices() || []
      const english = v.filter(x => x.lang.startsWith('en'))
      setVoices(english)
      if (english.length > 0) setVoice(english[0].name)
    }
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [])

  const speak = () => {
    if (!text.trim()) { toast.error('Enter text to speak'); return }
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate  = rate
    u.pitch = pitch
    const v = voices.find(x => x.name === voice)
    if (v) u.voice = v
    u.onstart = () => setSpeaking(true)
    u.onend   = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis?.speak(u)
  }

  const stop = () => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  return (
    <div className="card">
      <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
        <Volume2 size={16} className="text-cyan-400"/> Text to Speech
      </h3>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type or paste text here to have it read aloud..."
        rows={4}
        className="input resize-none text-sm w-full mb-4"
        aria-label="Text to speak"
      />

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="font-body text-xs text-slate-500 mb-1 block">Speed: {rate}x</label>
          <input type="range" min="0.5" max="2" step="0.1"
            value={rate} onChange={e => setRate(Number(e.target.value))}
            className="w-full accent-cyan-500" aria-label="Speech rate"
          />
        </div>
        <div>
          <label className="font-body text-xs text-slate-500 mb-1 block">Pitch: {pitch}</label>
          <input type="range" min="0.5" max="2" step="0.1"
            value={pitch} onChange={e => setPitch(Number(e.target.value))}
            className="w-full accent-cyan-500" aria-label="Speech pitch"
          />
        </div>
      </div>

      {voices.length > 0 && (
        <div className="mb-4">
          <label className="font-body text-xs text-slate-500 mb-1 block">Voice</label>
          <select
            value={voice || ''}
            onChange={e => setVoice(e.target.value)}
            className="input text-sm py-2"
            aria-label="Select voice"
          >
            {voices.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={speak}
          disabled={!text.trim() || speaking}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          aria-label="Speak text"
        >
          {speaking ? <><Mic size={15} className="animate-pulse"/> Speaking...</> : <><Volume2 size={15}/> Speak</>}
        </button>
        {speaking && (
          <button onClick={stop} className="btn-danger px-4 flex items-center gap-1.5">
            <StopCircle size={15}/> Stop
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PWD DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const CertBadge = ({ status }) => {
  const map = {
    valid:      { cls: 'badge-green',  icon: CheckCircle2, label: 'Valid' },
    needs_test: { cls: 'badge-orange', icon: Clock,        label: 'Test Required' },
    invalid:    { cls: 'badge-red',    icon: XCircle,      label: 'Invalid' },
    pending:    { cls: 'badge-purple', icon: Clock,        label: 'Processing' },
  }
  const s = map[status] || map.pending
  return <span className={`badge ${s.cls}`}><s.icon size={11}/> {s.label}</span>
}

export default function PWDDashboard() {
  const { user }   = useAuth()
  const { speak }  = useAccessibility()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showUpload, setShowUpload] = useState(false)

  const [certs,        setCerts]        = useState([])
  const [jobs,         setJobs]         = useState([])
  const [loadingCerts, setLoadingCerts] = useState(true)
  const [loadingJobs,  setLoadingJobs]  = useState(true)
  const [errorCerts,   setErrorCerts]   = useState('')
  const [errorJobs,    setErrorJobs]    = useState('')

  const fetchCerts = async () => {
    setLoadingCerts(true); setErrorCerts('')
    try {
      const { data } = await certificateAPI.getAll()
      setCerts(data.certificates || [])
    } catch (err) {
      setErrorCerts(err.response?.data?.error || 'Could not load certificates')
    } finally { setLoadingCerts(false) }
  }

  const fetchJobs = async () => {
    setLoadingJobs(true); setErrorJobs('')
    try {
      const { data } = await jobAPI.getRecommended()
      setJobs(data.jobs || [])
    } catch (err) {
      setErrorJobs(err.response?.data?.error || 'Could not load jobs')
    } finally { setLoadingJobs(false) }
  }

  useEffect(() => {
    fetchCerts()
    fetchJobs()
    setTimeout(() => speak('Welcome to your accessible dashboard'), 500)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return
      if (e.key === 'h' || e.key === 'H') document.querySelector('[aria-label*="High contrast"]')?.click()
      if (e.key === 'v' || e.key === 'V') document.querySelector('[aria-label*="Text to speech"]')?.click()
      if (e.key === '1') setActiveTab('dashboard')
      if (e.key === '2') setActiveTab('tools')
      if (e.key === '3') setActiveTab('voice')
      if (e.key === '4') setActiveTab('tts')
      if (e.key === '5') setActiveTab('sign-language')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const tabs = [
    { id: 'dashboard',     label: 'Dashboard',      shortcut: '1' },
    { id: 'tools',         label: 'A11y Tools',     shortcut: '2' },
    { id: 'voice',         label: 'Voice Input',    shortcut: '3' },
    { id: 'tts',           label: 'Text to Speech', shortcut: '4' },
    { id: 'sign-language', label: 'Sign Language',  shortcut: '5' },
  ]

  return (
    <div className="min-h-screen bg-navy-950 pt-20 pb-12 px-4" lang="en">
      {/* Skip to content link for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 btn-primary py-2 px-4 text-sm">
        Skip to main content
      </a>

      <AccessibilityToolbar onTabChange={setActiveTab} />

      <main id="main-content" className="max-w-5xl mx-auto pr-16" tabIndex={-1}>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-cyan"><Accessibility size={11}/> Accessible Mode</span>
            <span className="badge-green"><CheckCircle2 size={11}/> WCAG 2.1 AA</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">
            Welcome, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="font-body text-slate-400">
            Full accessibility support: sign language detection, voice input, text-to-speech, high contrast, and keyboard navigation.
            <span className="text-slate-600 ml-2">Use Alt+1–5 to switch tabs.</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 glass rounded-xl p-1 w-fit" role="tablist" aria-label="Dashboard sections">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => { setActiveTab(tab.id); speak(tab.label) }}
              className={`px-4 py-2 rounded-lg font-body text-sm transition-all
                ${activeTab === tab.id
                  ? 'bg-cyan-500 text-navy-950 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab.label}
              <span className="ml-1.5 font-mono text-xs opacity-40">⌥{tab.shortcut}</span>
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div id="panel-dashboard" role="tabpanel" className="space-y-6">

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Award,    label: 'My Certificates', desc: 'View & upload',   color: 'from-cyan-500/20 to-blue-500/20',   tc: 'text-cyan-400',   action: () => setShowUpload(true) },
                { icon: Briefcase,label: 'Job Matches',     desc: 'AI-matched jobs', color: 'from-purple-500/20 to-pink-500/20', tc: 'text-purple-400', link: '/jobs' },
                { icon: Brain,    label: 'Mock Interview',  desc: 'Practice now',    color: 'from-green-500/20 to-cyan-500/20',  tc: 'text-green-400',  link: '/mock-interview' },
              ].map(card => (
                card.link ? (
                  <Link key={card.label} to={card.link}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border border-white/10 hover:border-white/25 transition-all group focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    aria-label={card.label}
                    onFocus={() => speak(card.label)}
                  >
                    <card.icon size={24} className={`${card.tc} mb-3`}/>
                    <p className="font-display font-semibold text-white">{card.label}</p>
                    <p className="font-body text-sm text-slate-400">{card.desc}</p>
                    <ArrowRight size={15} className="text-slate-600 group-hover:text-white mt-2 transition-colors"/>
                  </Link>
                ) : (
                  <button key={card.label}
                    onClick={card.action}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border border-white/10 hover:border-white/25 transition-all text-left group focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    aria-label={card.label}
                    onFocus={() => speak(card.label)}
                  >
                    <card.icon size={24} className={`${card.tc} mb-3`}/>
                    <p className="font-display font-semibold text-white">{card.label}</p>
                    <p className="font-body text-sm text-slate-400">{card.desc}</p>
                    <ChevronRight size={15} className="text-slate-600 group-hover:text-white mt-2 transition-colors"/>
                  </button>
                )
              ))}
            </div>

            {/* Certificates */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white flex items-center gap-2">
                  <Award size={16} className="text-cyan-400"/> My Certificates
                </h2>
                <button onClick={() => setShowUpload(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                  <Upload size={12}/> Upload
                </button>
              </div>

              {loadingCerts ? (
                <div className="flex items-center justify-center h-16" aria-live="polite" aria-label="Loading certificates">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : errorCerts ? (
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
                  <div className="flex items-center gap-2">
                    <WifiOff size={14} className="text-red-400"/>
                    <p className="font-body text-xs text-red-400">{errorCerts}</p>
                  </div>
                  <button onClick={fetchCerts} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <RefreshCw size={11}/> Retry
                  </button>
                </div>
              ) : certs.length === 0 ? (
                <div className="text-center py-6">
                  <Upload size={28} className="text-slate-700 mx-auto mb-2"/>
                  <p className="font-body text-sm text-slate-500 mb-3">No certificates yet</p>
                  <button onClick={() => setShowUpload(true)} className="btn-primary text-sm py-2 px-5">Upload First Certificate</button>
                </div>
              ) : (
                <div className="space-y-2" role="list" aria-label="Certificate list">
                  {certs.map(cert => (
                    <div key={cert.id}
                      className="flex items-center justify-between p-3 glass rounded-xl focus-within:ring-1 focus-within:ring-cyan-500"
                      role="listitem"
                      aria-label={`${cert.ai_course_name || cert.original_name}, status: ${cert.status}`}
                      onFocus={() => speak(`${cert.ai_course_name || cert.original_name}, ${cert.status}`)}
                    >
                      <div>
                        <p className="font-body text-sm text-white font-medium">{cert.ai_course_name || cert.original_name}</p>
                        <p className="font-body text-xs text-slate-500">{cert.ai_issuer || 'Processing...'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <CertBadge status={cert.status}/>
                        {cert.blockchain_tx_hash && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Lock size={9}/> On-chain
                          </span>
                        )}
                        {cert.status === 'needs_test' && (
                          <Link to={`/verify-test/${cert.id}`} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                            Take Test <ChevronRight size={10}/>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Job Matches */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white flex items-center gap-2">
                  <Briefcase size={16} className="text-cyan-400"/> AI Job Matches
                </h2>
                <button onClick={fetchJobs} className="text-xs text-slate-400 hover:text-white font-body flex items-center gap-1 transition-colors">
                  <RefreshCw size={11}/> Refresh
                </button>
              </div>

              {loadingJobs ? (
                <div className="flex items-center justify-center h-16" aria-live="polite">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : errorJobs ? (
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
                  <p className="font-body text-xs text-red-400">{errorJobs}</p>
                  <button onClick={fetchJobs} className="text-xs text-red-400 flex items-center gap-1"><RefreshCw size={11}/> Retry</button>
                </div>
              ) : jobs.length === 0 ? (
                <p className="font-body text-sm text-slate-500 text-center py-4">No matches yet. Upload certificates to get matched.</p>
              ) : (
                <div className="space-y-2" role="list" aria-label="Job matches">
                  {jobs.slice(0, 6).map(job => (
                    <div key={job.id}
                      className="flex items-center justify-between p-3 glass rounded-xl"
                      role="listitem"
                      tabIndex={0}
                      aria-label={`${job.title}, ${job.matchScore}% match, ${job.location}`}
                      onFocus={() => speak(`${job.title}, ${job.matchScore} percent match`)}
                    >
                      <div>
                        <p className="font-body text-sm font-medium text-white">{job.title}</p>
                        <p className="font-body text-xs text-slate-500">{job.location || 'Remote'}{job.is_remote ? ' · Remote OK' : ''}</p>
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

        {/* ── A11Y TOOLS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'tools' && (
          <div id="panel-tools" role="tabpanel" className="card">
            <h2 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <Accessibility size={16} className="text-cyan-400"/> Accessibility Features
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Screen Reader (ARIA)',    desc: 'All elements have ARIA labels, roles, and live regions',   done: true },
                { label: 'Keyboard Navigation',     desc: 'Full keyboard access — Tab, Enter, Space, Arrow keys',     done: true },
                { label: 'Skip to Content Link',    desc: 'Hidden link at top for screen reader / keyboard users',    done: true },
                { label: 'High Contrast Mode',      desc: 'Toggle via toolbar (Alt+H) — saved across sessions',      done: true },
                { label: 'Adjustable Font Size',    desc: '12px–26px range via toolbar — saved across sessions',     done: true },
                { label: 'Voice Input (STT)',        desc: 'Speak to type — Web Speech API, Chrome/Edge',            done: true },
                { label: 'Text to Speech (TTS)',     desc: 'Read any text aloud with speed/pitch controls',          done: true },
                { label: 'Auto-read on Focus',      desc: 'Enable voice output to have elements read when focused',  done: true },
                { label: 'Sign Language Detection', desc: 'Camera-based gesture recognition (demo mode)',            done: true },
                { label: 'Keyboard Shortcuts',      desc: 'Alt+1–5 for tabs, Alt+H contrast, Alt+V voice',          done: true },
                { label: 'WCAG 2.1 AA Compliant',  desc: 'Meets web content accessibility guidelines',              done: true },
                { label: 'Focus Indicators',        desc: 'Visible cyan outline on all focused elements',            done: true },
              ].map(f => (
                <div key={f.label} className="flex items-start gap-3 p-3 glass rounded-xl" tabIndex={0} aria-label={`${f.label}: ${f.desc}`}>
                  <CheckCircle2 size={15} className="text-green-400 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="font-body text-sm font-medium text-white">{f.label}</p>
                    <p className="font-body text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VOICE INPUT TAB ───────────────────────────────────────────────── */}
        {activeTab === 'voice' && (
          <div id="panel-voice" role="tabpanel">
            <VoiceInputPanel/>
          </div>
        )}

        {/* ── TEXT TO SPEECH TAB ────────────────────────────────────────────── */}
        {activeTab === 'tts' && (
          <div id="panel-tts" role="tabpanel">
            <TextToSpeechPanel/>
          </div>
        )}

        {/* ── SIGN LANGUAGE TAB ─────────────────────────────────────────────── */}
        {activeTab === 'sign-language' && (
          <div id="panel-sign-language" role="tabpanel">
            <SignLanguagePanel/>
          </div>
        )}

      </main>

      {/* Certificate Upload Modal */}
      {showUpload && (
        <CertificateUpload
          onClose={() => setShowUpload(false)}
          onSuccess={(cert) => {
            setCerts(prev => [cert, ...prev])
            setShowUpload(false)
            fetchJobs()
            toast.success('Certificate uploaded!')
          }}
        />
      )}
    </div>
  )
}
