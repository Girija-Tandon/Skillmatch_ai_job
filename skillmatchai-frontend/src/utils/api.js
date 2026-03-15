// src/utils/api.js — Complete API Client + All Service Functions
import axios from 'axios'

// ── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sma_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sma_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICES  →  /api/auth/*
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data)          => api.post('/auth/register', data),
  login:         (data)          => api.post('/auth/login', data),
  getMe:         ()              => api.get('/auth/me'),
  logout:        ()              => api.post('/auth/logout'),
  updateProfile: (data)          => api.patch('/auth/update-profile', data),
  forgotPassword:(email)         => api.post('/auth/forgot-password', { email }),
  resetPassword: (token,password)=> api.post(`/auth/reset-password/${token}`, { password }),
  linkedinAuth:  ()              => { window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/linkedin` },
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE SERVICES  →  /api/certificates/*
// ─────────────────────────────────────────────────────────────────────────────
export const certificateAPI = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('certificate', file)
    return api.post('/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getAll:       ()              => api.get('/certificates'),
  getOne:       (id)            => api.get(`/certificates/${id}`),
  generateTest: (id)            => api.get(`/certificates/${id}/generate-test`),
  submitTest:   (id, answers)   => api.post(`/certificates/${id}/verify-test`, { answers }),
  revoke:       (id)            => api.patch(`/certificates/${id}/revoke`),
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB SERVICES  →  /api/jobs/*
// ─────────────────────────────────────────────────────────────────────────────
export const jobAPI = {
  getAll:        (params = {}) => api.get('/jobs', { params }),
  getRecommended:()            => api.get('/jobs/recommended'),
  getOne:        (id)          => api.get(`/jobs/${id}`),
  create:        (data)        => api.post('/jobs', data),
  update:        (id, data)    => api.patch(`/jobs/${id}`, data),
  delete:        (id)          => api.delete(`/jobs/${id}`),
  apply:         (id)          => api.post(`/jobs/${id}/apply`),
  getApplicants: (id)          => api.get(`/jobs/${id}/applicants`),
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL SERVICES  →  /api/skills/*
// ─────────────────────────────────────────────────────────────────────────────
export const skillAPI = {
  getGap:         (targetRole = '') => api.get('/skills/gap', { params: { targetRole } }),
  getCourses:     (skills = [])     => api.get('/skills/courses', { params: { skills: skills.join(',') } }),
  updateSkills:   (skills)          => api.post('/skills/update', { skills }),
  getMarketDemand:()                => api.get('/skills/market-demand'),
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW SERVICES  →  /api/interviews/*
// ─────────────────────────────────────────────────────────────────────────────
export const interviewAPI = {
  start:        (targetRole)                       => api.post('/interviews/start', { targetRole }),
  submitAnswer: (interviewId, questionId, answer)  => api.post(`/interviews/${interviewId}/answer`, { questionId, answerText: answer }),
  getResults:   (interviewId)                      => api.get(`/interviews/${interviewId}/results`),
  getHistory:   ()                                 => api.get('/interviews/history'),
  delete:       (interviewId)                      => api.delete(`/interviews/${interviewId}`),
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCKCHAIN SERVICES  →  /api/blockchain/*
// ─────────────────────────────────────────────────────────────────────────────
export const blockchainAPI = {
  verify:    (hash) => api.get(`/blockchain/verify/${hash}`),
  getMyCerts:()     => api.get('/blockchain/my-certs'),
}
