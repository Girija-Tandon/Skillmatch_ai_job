import { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

export const AccessibilityProvider = ({ children }) => {
  const [highContrast,    setHighContrast]    = useState(() => localStorage.getItem('a11y_hc') === 'true')
  const [fontSize,        setFontSize]        = useState(() => Number(localStorage.getItem('a11y_fs')) || 16)
  const [voiceEnabled,    setVoiceEnabled]    = useState(() => localStorage.getItem('a11y_voice') === 'true')
  const [signLangEnabled, setSignLangEnabled] = useState(false)

  // Persist preferences
  useEffect(() => { localStorage.setItem('a11y_hc',    highContrast) },  [highContrast])
  useEffect(() => { localStorage.setItem('a11y_fs',    fontSize) },      [fontSize])
  useEffect(() => { localStorage.setItem('a11y_voice', voiceEnabled) },  [voiceEnabled])

  // Apply high contrast to <html> so it works globally
  useEffect(() => {
    if (highContrast) document.documentElement.classList.add('high-contrast')
    else              document.documentElement.classList.remove('high-contrast')
  }, [highContrast])

  // Apply font size to <html>
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  // speak() — works whenever called, regardless of voiceEnabled toggle
  // voiceEnabled toggle controls whether it auto-reads on focus
  const speak = (text, force = false) => {
    if (!text) return
    if (!voiceEnabled && !force) return
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate   = 0.9
    u.volume = 1
    window.speechSynthesis?.speak(u)
  }

  const speakForce = (text) => speak(text, true)

  const increaseFontSize = () => setFontSize(s => Math.min(s + 2, 26))
  const decreaseFontSize = () => setFontSize(s => Math.max(s - 2, 12))

  return (
    <AccessibilityContext.Provider value={{
      highContrast,    setHighContrast,
      fontSize,        increaseFontSize, decreaseFontSize,
      voiceEnabled,    setVoiceEnabled,
      signLangEnabled, setSignLangEnabled,
      speak, speakForce,
    }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => useContext(AccessibilityContext)
