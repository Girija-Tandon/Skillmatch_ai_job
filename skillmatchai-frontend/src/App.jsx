import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }          from './context/AuthContext'
import { AccessibilityProvider } from './context/AccessibilityContext'
import Navbar          from './components/common/Navbar'
import ProtectedRoute  from './components/common/ProtectedRoute'
import Landing              from './pages/Landing'
import Login                from './pages/Login'
import Register             from './pages/Register'
import JobSeekerDashboard   from './pages/JobSeekerDashboard'
import PWDDashboard         from './pages/PWDDashboard'
import RecruiterDashboard   from './pages/RecruiterDashboard'
import MockInterview        from './pages/MockInterview'
import VerifyTest           from './pages/VerifyTest'
import BlockchainVerify     from './pages/BlockchainVerify'
import SkillGapPage         from './pages/SkillGapPage'
import SmartJobsPage        from './pages/SmartJobsPage'
import ProfilePage          from './pages/ProfilePage'
import CertificatesPage     from './pages/CertificatesPage'

const T = {
  style:{ background:'#0A1628',color:'#E2E8F0',border:'1px solid rgba(255,255,255,0.08)',fontFamily:'DM Sans,sans-serif',fontSize:'14px',borderRadius:'12px' },
  success:{ iconTheme:{ primary:'#10B981',secondary:'#0A1628' }},
  error:  { iconTheme:{ primary:'#EF4444',secondary:'#0A1628' }},
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <div className="min-h-screen bg-navy-950">
            <Navbar />
            <Routes>
              {/* Public */}
              <Route path="/"             element={<Landing />} />
              <Route path="/login"        element={<Login />} />
              <Route path="/register"     element={<Register />} />
              <Route path="/verify/:hash" element={<BlockchainVerify />} />

              {/* Job Seeker */}
              <Route path="/dashboard"          element={<ProtectedRoute roles={['jobseeker']}><JobSeekerDashboard /></ProtectedRoute>} />
              <Route path="/mock-interview"      element={<ProtectedRoute roles={['jobseeker','pwd_candidate']}><MockInterview /></ProtectedRoute>} />
              <Route path="/verify-test/:certId" element={<ProtectedRoute roles={['jobseeker','pwd_candidate','recruiter']}><VerifyTest /></ProtectedRoute>} />
              <Route path="/skill-gap"           element={<ProtectedRoute roles={['jobseeker','pwd_candidate']}><SkillGapPage /></ProtectedRoute>} />
              <Route path="/jobs"                element={<ProtectedRoute roles={['jobseeker','pwd_candidate']}><SmartJobsPage /></ProtectedRoute>} />
              <Route path="/certificates"        element={<ProtectedRoute roles={['jobseeker','pwd_candidate']}><CertificatesPage /></ProtectedRoute>} />
              <Route path="/profile"             element={<ProtectedRoute roles={['jobseeker','pwd_candidate','recruiter']}><ProfilePage /></ProtectedRoute>} />

              {/* PWD */}
              <Route path="/pwd-dashboard" element={<ProtectedRoute roles={['pwd_candidate']}><PWDDashboard /></ProtectedRoute>} />

              {/* Recruiter */}
              <Route path="/recruiter" element={<ProtectedRoute roles={['recruiter']}><RecruiterDashboard /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" toastOptions={T} />
          </div>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
