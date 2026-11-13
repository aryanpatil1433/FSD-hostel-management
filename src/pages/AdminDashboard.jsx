import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Search, 
  Building2, 
  Lock, 
  Edit3, 
  RefreshCw, 
  X, 
  Check, 
  Phone,
  Eye,
  FileSpreadsheet
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { HOSTEL_BLOCKS, COMPLAINT_TYPES, STATUS_LIST } from '../lib/constants'
import StatusBadge from '../components/StatusBadge'
import UrgencyBadge from '../components/UrgencyBadge'

export default function AdminDashboard() {
  const adminPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'warden2026'

  // Auth State for Dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('hcp_admin_auth') === 'true'
  })
  const [enteredPasscode, setEnteredPasscode] = useState('')
  const [authError, setAuthError] = useState('')

  // Data & Filter State
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBlock, setSelectedBlock] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedType, setSelectedType] = useState('All')

  // Edit/Resolution Modal State
  const [activeComplaint, setActiveComplaint] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch Complaints from Supabase
  const fetchComplaints = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setComplaints([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setComplaints(data || [])
    } catch (err) {
      console.error('Error fetching admin complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints()
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (enteredPasscode.trim() === adminPasscode.trim()) {
      setIsAuthenticated(true)
      sessionStorage.setItem('hcp_admin_auth', 'true')
      setAuthError('')
    } else {
      setAuthError('Incorrect passcode. Default passcode is warden2026')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('hcp_admin_auth')
  }

  const openUpdateModal = (item) => {
    setActiveComplaint(item)
    setNewStatus(item.status)
    setResolutionNotes(item.resolution_notes || '')
    setAssignedTo(item.assigned_to || 'Campus Maintenance Cell')
    setSaveSuccess(false)
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!activeComplaint) return

    setSaving(true)
    try {
      if (isSupabaseConfigured() && supabase) {
        const updatePayload = {
          status: newStatus,
          resolution_notes: resolutionNotes.trim() || null,
          assigned_to: assignedTo.trim() || null,
          updated_at: new Date().toISOString(),
        }

        if (['Resolved', 'Closed'].includes(newStatus) && !activeComplaint.resolved_at) {
          updatePayload.resolved_at = new Date().toISOString()
        }

        const { error } = await supabase
          .from('complaints')
          .update(updatePayload)
          .eq('id', activeComplaint.id)

        if (error) throw error

        await supabase.from('complaint_updates').insert([
          {
            complaint_id: activeComplaint.id,
            previous_status: activeComplaint.status,
            new_status: newStatus,
            note: resolutionNotes.trim() || `Status updated to ${newStatus}`,
            updated_by: 'Hostel Administration',
          },
        ])

        setComplaints(prev =>
          prev.map(c => (c.id === activeComplaint.id ? { ...c, ...updatePayload } : c))
        )
      } else {
        setComplaints(prev =>
          prev.map(c =>
            c.id === activeComplaint.id
              ? { ...c, status: newStatus, resolution_notes: resolutionNotes, assigned_to: assignedTo }
              : c
          )
        )
      }

      setSaveSuccess(true)
      setTimeout(() => {
        setActiveComplaint(null)
      }, 700)
    } catch (err) {
      console.error('Failed to update complaint status:', err)
      alert(`Error updating: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const filteredComplaints = complaints.filter(item => {
    const matchesBlock = selectedBlock === 'All' || item.hostel_block === selectedBlock
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus
    const matchesType = selectedType === 'All' || item.complaint_type === selectedType

    const search = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !search ||
      item.ticket_number?.toLowerCase().includes(search) ||
      item.student_name?.toLowerCase().includes(search) ||
      item.student_phone?.includes(search) ||
      item.room_number?.toLowerCase().includes(search) ||
      item.title?.toLowerCase().includes(search)

    return matchesBlock && matchesStatus && matchesType && matchesSearch
  })

  const totalCount = complaints.length
  const pendingCount = complaints.filter(c => ['Submitted', 'In Review'].includes(c.status)).length
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length
  const emergencyCount = complaints.filter(c => c.urgency === 'Emergency' && c.status !== 'Closed').length

  const exportToCSV = () => {
    if (filteredComplaints.length === 0) return
    const headers = ['Ticket Number,Hostel Block,Room,Student,Phone,Type,Urgency,Status,Title,Created At\n']
    const rows = filteredComplaints.map(c =>
      `"${c.ticket_number}","${c.hostel_block}","${c.room_number}","${c.student_name}","${c.student_phone}","${c.complaint_type}","${c.urgency}","${c.status}","${c.title?.replace(/"/g, '""')}","${c.created_at}"`
    )
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Hostel_Complaints_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  // Passcode Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 space-y-6 shadow-xl text-center border border-white/90">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Hostel Administration Portal</h2>
            <p className="text-xs text-slate-500">
              Enter warden / management passcode to access complaint records and resolution controls.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">Admin Passcode</label>
              <input
                type="password"
                value={enteredPasscode}
                onChange={(e) => setEnteredPasscode(e.target.value)}
                placeholder="Enter passcode (default: warden2026)"
                required
                className="w-full px-4 py-3 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              Unlock Dashboard
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            Passcode configured in <code className="text-indigo-600 font-mono font-medium">.env</code> as <code className="text-slate-600">VITE_ADMIN_PASSCODE</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-semibold mb-1 shadow-2xs">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Campus Facilities Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hostel Complaints Management
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring Boys Hostel 1, 2 & Girls Hostel 1, 2 maintenance requests
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchComplaints}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Refresh Complaints List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-xs font-semibold text-slate-700 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Lock
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-[11px] text-slate-500 block font-semibold">Total Tickets</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-[11px] text-amber-700 block font-semibold">Pending Review</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-[11px] text-sky-700 block font-semibold">In Progress</span>
          <div className="text-2xl font-black text-sky-700 mt-1">{inProgressCount}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card">
          <span className="text-[11px] text-emerald-700 block font-semibold">Resolved</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
        </div>
        <div className="p-4 rounded-2xl glass-card col-span-2 sm:col-span-1">
          <span className="text-[11px] text-rose-700 block font-semibold">Emergency</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{emergencyCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel flex flex-col lg:flex-row items-stretch lg:items-center gap-3 shadow-sm border border-white/90">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Room #, Student, Phone, or Ticket..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-3 gap-2">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs text-slate-700 cursor-pointer font-medium"
          >
            <option value="All">All Hostels</option>
            {HOSTEL_BLOCKS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs text-slate-700 cursor-pointer font-medium"
          >
            <option value="All">All Statuses</option>
            {STATUS_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs text-slate-700 cursor-pointer font-medium"
          >
            <option value="All">All Types</option>
            {COMPLAINT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table Container */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Student & Contact</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Issue Title & Type</th>
                <th className="py-3.5 px-4">Urgency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No complaints matching current filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-indigo-700 font-bold block">
                        {item.ticket_number}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.student_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.student_phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">{item.hostel_block}</div>
                      <div className="text-[11px] text-indigo-700 font-mono font-medium">Room {item.room_number}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.complaint_type} • {item.category}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <UrgencyBadge urgency={item.urgency} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/track?query=${item.ticket_number}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="View Public Tracking Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openUpdateModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warden Quick Update Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setActiveComplaint(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700">
                  {activeComplaint.ticket_number}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600 font-medium">
                  {activeComplaint.hostel_block} (Room {activeComplaint.room_number})
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{activeComplaint.title}</h3>
            </div>

            {/* Attached Photo Preview if any */}
            {activeComplaint.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-1.5 max-h-36 flex items-center justify-center">
                <img
                  src={activeComplaint.image_url}
                  alt="Attached photo"
                  className="max-h-32 object-contain rounded-lg shadow-xs"
                />
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 cursor-pointer font-medium"
                >
                  {STATUS_LIST.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Assigned Technician / Cell</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="e.g. Ramesh (Electrician), Maintenance Cell"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Resolution Remarks / Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter remarks (e.g. Capacitor replaced, tested and verified by floor warden)."
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveComplaint(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Updated!</span>
                    </>
                  ) : saving ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Save Update</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
