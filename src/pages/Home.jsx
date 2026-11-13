import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Building2, 
  PlusCircle, 
  Search, 
  Wrench, 
  Zap, 
  Droplet, 
  Wifi, 
  Sparkles,
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Flame,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function Home() {
  const navigate = useNavigate()
  const [recentTicket, setRecentTicket] = useState(() => sessionStorage.getItem('hcp_latest_ticket') || '')
  const [quickTicket, setQuickTicket] = useState(() => sessionStorage.getItem('hcp_latest_ticket') || '')
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0,
    emergency: 0,
    loading: true,
  })

  useEffect(() => {
    async function fetchStats() {
      if (!isSupabaseConfigured() || !supabase) {
        setStats({
          total: 0,
          inProgress: 0,
          resolved: 0,
          emergency: 0,
          loading: false,
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('id, status, urgency')

        if (error) throw error

        const total = data.length
        const inProgress = data.filter(d => ['In Review', 'In Progress'].includes(d.status)).length
        const resolved = data.filter(d => ['Resolved', 'Closed'].includes(d.status)).length
        const emergency = data.filter(d => d.urgency === 'Emergency' && d.status !== 'Closed').length

        setStats({ total, inProgress, resolved, emergency, loading: false })
      } catch (err) {
        console.warn('Could not fetch complaint stats:', err)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const handleQuickTrack = (e) => {
    e.preventDefault()
    if (!quickTicket.trim()) return
    navigate(`/track?query=${encodeURIComponent(quickTicket.trim())}`)
  }

  const quickCategories = [
    { title: 'Electrical', desc: 'Fan, lights, sockets, switches', icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { title: 'Plumbing', desc: 'Leaking taps, washroom, drain', icon: Droplet, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    { title: 'Carpentry', desc: 'Bed, study desk, doors, latches', icon: Wrench, color: 'text-orange-700 bg-orange-50 border-orange-200' },
    { title: 'WiFi & Network', desc: 'LAN ports, router, internet', icon: Wifi, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  ]

  const hostelCards = [
    { name: 'Boys Hostel 1', code: 'BH-1', tag: 'Block A & B' },
    { name: 'Boys Hostel 2', code: 'BH-2', tag: 'Block C & D' },
    { name: 'Girls Hostel 1', code: 'GH-1', tag: 'Block Alpha' },
    { name: 'Girls Hostel 2', code: 'GH-2', tag: 'Block Beta' },
  ]

  return (
    <div className="space-y-14 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Official Hostel Facilities & Complaint Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Resolve hostel issues with speed & transparency.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Submit room and common area maintenance requests in seconds. Track real-time repair progress across Boys & Girls hostels with automated ticket logging.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/submit"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>Register a Complaint</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/admin"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span>Staff Dashboard</span>
          </Link>
        </div>

        {/* Instant Track Search Bar with Auto-Assigned Ticket */}
        <div className="pt-4 max-w-xl mx-auto space-y-2">
          <form
            onSubmit={handleQuickTrack}
            className="p-1.5 rounded-2xl glass-panel shadow-md flex items-center gap-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={quickTicket}
              onChange={(e) => setQuickTicket(e.target.value)}
              placeholder="Track by Ticket # (e.g. HCP-2026-...) or Phone Number"
              className="bg-transparent flex-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden py-2 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex-shrink-0 shadow-xs"
            >
              Track
            </button>
          </form>

          {recentTicket && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px]">Auto-assigned recent ticket:</span>
              <button
                type="button"
                onClick={() => navigate(`/track?query=${encodeURIComponent(recentTicket)}`)}
                className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold hover:bg-indigo-100 transition-colors"
              >
                {recentTicket} →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Live Metric Cards (Light Glassmorphic) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Complaints</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.loading ? '—' : stats.total}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged in system</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-xs font-semibold">In Progress</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-700">
            {stats.loading ? '—' : stats.inProgress}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Technicians dispatched</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">Resolved</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {stats.loading ? '—' : stats.resolved}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Completed & verified</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl glass-card">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">Urgent / Emergency</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">
            {stats.loading ? '—' : stats.emergency}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">High-priority tasks</p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Common Maintenance Categories</h2>
            <p className="text-xs text-slate-500">Select what needs fixing for immediate dispatch</p>
          </div>
          <Link
            to="/submit"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
          >
            File now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickCategories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <div
                key={i}
                className="p-5 rounded-2xl glass-card flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cat.color} shadow-2xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to={`/submit?type=${encodeURIComponent(cat.title)}`}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                  >
                    Raise this issue <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Hostel Blocks Section */}
      <section className="p-6 sm:p-8 rounded-3xl glass-panel space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Supported Hostel Blocks
            </h2>
            <p className="text-xs text-slate-500">All student residential wings are monitored 24/7</p>
          </div>
          <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto font-semibold">
            ● Active Service Desk
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {hostelCards.map((b, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-indigo-600 font-bold">{b.code}</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{b.name}</h4>
                <p className="text-[11px] text-slate-500">{b.tag}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Rooms 101 - 420</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
