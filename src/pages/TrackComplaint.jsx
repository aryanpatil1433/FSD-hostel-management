import React, { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  ChevronRight,
  Maximize2,
  X,
  Copy,
  Check,
  Sparkles,
  History
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import StatusBadge from '../components/StatusBadge'
import UrgencyBadge from '../components/UrgencyBadge'

export default function TrackComplaint() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { ticketId } = useParams()

  // Automatic ticket assignment from params or session storage
  const [query, setQuery] = useState(() => {
    return ticketId || searchParams.get('query') || sessionStorage.getItem('hcp_latest_ticket') || ''
  })

  const [complaint, setComplaint] = useState(null)
  const [multipleResults, setMultipleResults] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [recentTicket, setRecentTicket] = useState(() => sessionStorage.getItem('hcp_latest_ticket'))

  const steps = ['Submitted', 'In Review', 'In Progress', 'Resolved']

  const getStepIndex = (status) => {
    switch (status) {
      case 'Submitted': return 0
      case 'In Review': return 1
      case 'In Progress': return 2
      case 'Resolved':
      case 'Closed': return 3
      case 'Rejected': return -1
      default: return 0
    }
  }

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setComplaint(null)
    setMultipleResults([])
    setUpdates([])

    if (!isSupabaseConfigured() || !supabase) {
      setError('Supabase is not configured yet. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to query live complaints.')
      setLoading(false)
      return
    }

    try {
      const trimmed = searchQuery.trim()
      const isTicket = trimmed.toUpperCase().startsWith('HCP')

      let complaintQuery = supabase.from('complaints').select('*')

      if (isTicket) {
        complaintQuery = complaintQuery.ilike('ticket_number', trimmed)
      } else {
        complaintQuery = complaintQuery.or(`student_phone.ilike.%${trimmed}%,room_number.ilike.%${trimmed}%`)
      }

      const { data, error: dbError } = await complaintQuery.order('created_at', { ascending: false })

      if (dbError) throw dbError

      if (!data || data.length === 0) {
        setError(`No complaint found matching "${trimmed}". Please double check your ticket number or phone number.`)
      } else if (data.length === 1) {
        setComplaint(data[0])
        fetchUpdates(data[0].id)
      } else {
        setMultipleResults(data)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'An error occurred while tracking complaint.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUpdates = async (complaintId) => {
    try {
      const { data } = await supabase
        .from('complaint_updates')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true })

      if (data) setUpdates(data)
    } catch (err) {
      console.warn('Could not fetch timeline updates:', err)
    }
  }

  // Automatically execute search when ticket ID is assigned or loaded
  useEffect(() => {
    const activeTarget = ticketId || searchParams.get('query') || sessionStorage.getItem('hcp_latest_ticket')
    if (activeTarget) {
      setQuery(activeTarget)
      performSearch(activeTarget)
    }
  }, [ticketId, searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearchParams({ query: query.trim() })
    performSearch(query.trim())
  }

  const selectSingleComplaint = (item) => {
    setComplaint(item)
    setMultipleResults([])
    fetchUpdates(item.id)
  }

  const copyTicket = () => {
    if (!complaint) return
    navigator.clipboard.writeText(complaint.ticket_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentStep = complaint ? getStepIndex(complaint.status) : 0

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Complaint Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your Ticket Number (e.g. <span className="font-mono text-indigo-600 font-semibold">HCP-2026-XXXX</span>) or Student Phone. Recent tickets are automatically assigned.
        </p>
      </div>

      {/* Search Input Box with Glassmorphism */}
      <div className="max-w-2xl mx-auto space-y-2.5">
        <form
          onSubmit={handleSearchSubmit}
          className="p-1.5 rounded-2xl glass-panel shadow-md flex items-center gap-2 border border-white/90 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <div className="pl-3.5 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Ticket ID (HCP-...) or 10-digit Phone"
            className="bg-transparent flex-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden py-2.5 font-medium"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Auto-Assigned Ticket Quick Chip */}
        {recentTicket && recentTicket !== query && (
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Auto-assigned ticket:
            </span>
            <button
              onClick={() => {
                setQuery(recentTicket)
                setSearchParams({ query: recentTicket })
                performSearch(recentTicket)
              }}
              className="px-2.5 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {recentTicket}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 leading-relaxed font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Multiple Results Found */}
      {multipleResults.length > 0 && (
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="text-xs text-slate-500 flex items-center justify-between font-medium">
            <span>Found {multipleResults.length} complaints for "{query}"</span>
            <span className="text-[11px] text-slate-400">Click to view details</span>
          </div>

          <div className="space-y-2">
            {multipleResults.map((item) => (
              <div
                key={item.id}
                onClick={() => selectSingleComplaint(item)}
                className="p-4 rounded-2xl glass-card cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {item.ticket_number}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    {item.hostel_block} • Room {item.room_number} • {item.complaint_type}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single Complaint Details View */}
      {complaint && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl border border-white/90 space-y-8">
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-indigo-700">
                  {complaint.ticket_number}
                </span>
                <button
                  onClick={copyTicket}
                  className="p-1 rounded text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Copy Ticket ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <StatusBadge status={complaint.status} size="lg" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{complaint.title}</h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <UrgencyBadge urgency={complaint.urgency} />
            </div>
          </div>

          {/* Progress Timeline Tracker */}
          {complaint.status !== 'Rejected' ? (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Resolution Workflow
              </span>
              <div className="grid grid-cols-4 gap-2">
                {steps.map((step, idx) => {
                  const isDone = currentStep >= idx
                  const isCurrent = currentStep === idx

                  return (
                    <div key={step} className="space-y-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isDone ? 'bg-indigo-600' : 'bg-slate-200'
                        } ${isCurrent ? 'ring-2 ring-indigo-500/30' : ''}`}
                      />
                      <div className="text-[11px]">
                        <p className={`font-bold ${isDone ? 'text-indigo-900' : 'text-slate-400'}`}>
                          {step}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <div className="text-xs text-rose-800 font-medium">
                This complaint was rejected by administration. Please check the resolution remarks below or visit the Warden Office.
              </div>
            </div>
          )}

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Hostel & Room</span>
              <span className="text-slate-900 font-bold mt-0.5 block">{complaint.hostel_block}</span>
              <span className="text-indigo-600 font-mono text-[11px] font-semibold">Room {complaint.room_number}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Category / Area</span>
              <span className="text-slate-900 font-bold mt-0.5 block">{complaint.complaint_type}</span>
              <span className="text-slate-600 text-[11px]">{complaint.category}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Reported By</span>
              <span className="text-slate-900 font-bold mt-0.5 block">{complaint.student_name}</span>
              <span className="text-slate-600 font-mono text-[11px]">{complaint.student_phone}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Submitted On</span>
              <span className="text-slate-900 font-bold mt-0.5 block">
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
              <span className="text-slate-500 text-[11px]">
                {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Description & Optional Image */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Problem Description
            </span>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-2xs">
              {complaint.description}
            </div>

            {/* Optional Attached Photo */}
            {complaint.image_url && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Attached Issue Photo
                </span>
                <div
                  onClick={() => setShowImageModal(true)}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white w-full max-w-xs cursor-pointer shadow-xs"
                >
                  <img
                    src={complaint.image_url}
                    alt="Complaint attachment"
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-semibold">
                    <Maximize2 className="w-4 h-4" />
                    <span>View Full Photo</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resolution & Staff Notes */}
          {complaint.resolution_notes && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
              <span className="text-xs font-bold text-indigo-950 block">
                Staff / Technician Remarks:
              </span>
              <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                {complaint.resolution_notes}
              </p>
              {complaint.resolved_at && (
                <p className="text-[10px] text-indigo-700 pt-1 font-medium">
                  Resolved on {new Date(complaint.resolved_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Activity History */}
          {updates.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Activity Log
              </span>
              <div className="space-y-2 border-l-2 border-indigo-200 pl-4 ml-1">
                {updates.map((up) => (
                  <div key={up.id} className="relative space-y-1">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{up.new_status}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(up.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{up.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {showImageModal && complaint?.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-200 p-2 cursor-pointer font-bold"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={complaint.image_url}
              alt="Full attachment"
              className="max-h-[85vh] w-auto rounded-2xl border border-white/20 object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
