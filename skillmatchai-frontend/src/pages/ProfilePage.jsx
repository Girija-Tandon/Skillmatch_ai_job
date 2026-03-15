// src/pages/ProfilePage.jsx
// ✅ PATCH /api/auth/update-profile
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'
import { User, Save, ArrowLeft, Plus, X, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [name,    setName]    = useState(user?.name || '')
  const [bio,     setBio]     = useState(user?.bio  || '')
  const [skills,  setSkills]  = useState(user?.skills || [])
  const [newSkill,setNewSkill]= useState('')
  const [saving,  setSaving]  = useState(false)

  const addSkill = () => {
    const s = newSkill.trim()
    if (!s || skills.includes(s)) return
    setSkills(prev => [...prev, s])
    setNewSkill('')
  }

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await authAPI.updateProfile({ name, bio, skills })
      setUser(data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-body text-sm mb-6 transition-colors">
          <ArrowLeft size={15}/> Back
        </Link>
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <User size={28} className="text-cyan-400"/>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Edit Profile</h1>
              <p className="font-body text-sm text-slate-400">{user?.email} · <span className="capitalize">{user?.role}</span></p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block font-body text-sm text-slate-400 mb-1.5">Full Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="input w-full" placeholder="Your name"/>
            </div>
            <div>
              <label className="block font-body text-sm text-slate-400 mb-1.5">Bio</label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="input w-full resize-none" placeholder="Tell employers about yourself..."/>
            </div>
            <div>
              <label className="block font-body text-sm text-slate-400 mb-1.5">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-8">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <span className="font-body text-sm text-cyan-400">{s}</span>
                    <button onClick={()=>setSkills(p=>p.filter(x=>x!==s))} className="text-cyan-700 hover:text-red-400"><X size={11}/></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Add skill..." className="input flex-1 text-sm py-2"/>
                <button onClick={addSkill} className="btn-ghost py-2 px-4 text-sm flex items-center gap-1.5"><Plus size={14}/> Add</button>
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : <><Save size={16}/> Save Profile</>}
          </button>
        </div>
      </div>
    </div>
  )
}
