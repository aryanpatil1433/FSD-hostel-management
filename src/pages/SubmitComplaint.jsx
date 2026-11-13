import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  Send, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  Copy, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  User, 
  Hash, 
  FileText, 
  Image as ImageIcon,
  Flame,
  Zap,
  Droplet,
  Lock,
  Sparkles,
  Loader2
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { uploadComplaintImage } from '../lib/storage'
import { checkRateLimit, recordSubmission, formatRemainingTime } from '../lib/rateLimiter'
import { HOSTEL_BLOCKS, COMPLAINT_TYPES, CATEGORIES, URGENCY_LEVELS } from '../lib/constants'

// Quick-fill emergency presets for rapid 1-click filing
const EMERGENCY_PRESETS = [
  {
    id: 'pipe-burst',
    label: 'Water Pipe Burst',
    icon: Droplet,
    type: 'Plumbing',
    category: 'Bathroom/Washroom',
    urgency: 'Emergency',
    title: 'Urgent: Water pipe burst and continuous flooding',
    desc: 'Severe water leakage from the pipeline causing water accumulation. Immediate plumbing intervention needed to prevent room damage.',
  },
  {
    id: 'sparks',
    label: 'Electric Sparks',
    icon: Zap,
    type: 'Electrical',
    category: 'Room Maintenance',
    urgency: 'Emergency',
    title: 'Emergency: Electrical switchboard sparking / burning smell',
    desc: 'Noticeable sparks and burning plastic smell coming from the main power board. Power disconnected for safety, urgent electrician required.',
  },
  {
    id: 'lock-jammed',
    label: 'Door Lock Jammed',
    icon: Lock,
    type: 'Carpentry',
    category: 'Room Maintenance',
    urgency: 'Emergency',
    title: 'Urgent: Room door latch jammed, student unable to open',
    desc: 'The door lock cylinder failed and the latch will not retract. Student is unable to exit/enter room securely.',
  },
  {
    id: 'hazard',
    label: 'Hazardous Smell / Gas',
    icon: Flame,
    type: 'Security/Noise',
    category: 'Common Area',
    urgency: 'Emergency',
    title: 'Emergency: Severe chemical/burning odor detected in wing',
    desc: 'Strong unusual burning odor noticed in corridor area. Needs immediate warden and safety cell investigation.',
  },
]

export default function SubmitComplaint() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef(null)

  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    student_phone: '',
    student_roll_no: '',
    hostel_block: HOSTEL_BLOCKS[0],
    room_number: '',
    complaint_type: searchParams.get('type') || 'Maintenance',
    category: 'Room Maintenance',
    urgency: 'Normal',
    title: '',
    description: '',
  })

  // Optional Image State
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Status & Rate Limit State
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [presetNotice, setPresetNotice] = useState('')
  const [rateLimitState, setRateLimitState] = useState({ isLimited: false, remainingSeconds: 0 })
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [copied, setCopied] = useState(false)

  // Periodic Rate Limit Check
  useEffect(() => {
    const updateLimit = () => {
      const res = checkRateLimit(formData.student_phone, formData.room_number)
      setRateLimitState(res)
    }

    updateLimit()
    const timer = setInterval(updateLimit, 1000)
    return () => clearInterval(timer)
  }, [formData.student_phone, formData.room_number])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errorMessage) setErrorMessage('')
  }

  // Emergency Quick Filler Handler
  const applyEmergencyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      complaint_type: preset.type,
      category: preset.category,
      urgency: 'Emergency',
      title: preset.title,
      description: preset.desc,
    }))
    setPresetNotice(`Loaded "${preset.label}" emergency preset. Please confirm your room number & contact phone.`)
    setTimeout(() => setPresetNotice(''), 5000)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit.')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    // Client-side validation
    if (!formData.student_name.trim()) {
      setErrorMessage('Student name is required.')
      return
    }
    if (!formData.student_phone.trim()) {
      setErrorMessage('Student phone/WhatsApp number is required.')
      return
    }
    if (!formData.room_number.trim()) {
      setErrorMessage('Room number is required.')
      return
    }
    if (!formData.title.trim()) {
      setErrorMessage('Please provide a brief title for the complaint.')
      return
    }
    if (!formData.description.trim()) {
      setErrorMessage('Please describe the issue.')
      return
    }

    // Rate limiting check
    const currentLimit = checkRateLimit(formData.student_phone, formData.room_number)
    if (currentLimit.isLimited) {
      setErrorMessage(`Rate limit active: Maximum 3 complaints allowed per 15 mins. Please wait ${formatRemainingTime(currentLimit.remainingSeconds)}.`)
      return
    }

    setSubmitting(true)

    try {
      let imageUrl = null
      if (imageFile) {
        if (!isSupabaseConfigured()) {
          imageUrl = null
        } else {
          setUploadProgress('Uploading attachment photo...')
          imageUrl = await uploadComplaintImage(imageFile)
        }
      }

      // Generate fallback ticket number
      const year = new Date().getFullYear()
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
      const generatedTicket = `HCP-${year}-${rand}`

      const payload = {
        ticket_number: generatedTicket,
        student_name: formData.student_name.trim(),
        student_phone: formData.student_phone.trim(),
        student_roll_no: formData.student_roll_no.trim() || null,
        hostel_block: formData.hostel_block,
        room_number: formData.room_number.trim(),
        complaint_type: formData.complaint_type,
        category: formData.category,
        urgency: formData.urgency,
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: imageUrl,
        status: 'Submitted',
      }

      let finalTicket = generatedTicket

      if (isSupabaseConfigured() && supabase) {
        setUploadProgress('Submitting to database...')
        const { data, error } = await supabase
          .from('complaints')
          .insert([payload])
          .select('ticket_number')
          .single()

        if (error) {
          if (error.message && error.message.includes('RATE_LIMIT_EXCEEDED')) {
            throw new Error('Rate limit exceeded: You have submitted too many complaints recently. Please wait 15 minutes before filing again.')
          }
          throw error
        }

        finalTicket = data?.ticket_number || generatedTicket
      }

      // Automatically assign and persist ticket ID for seamless auto-tracking
      sessionStorage.setItem('hcp_latest_ticket', finalTicket)
      localStorage.setItem('hcp_latest_ticket', finalTicket)
      recordSubmission(formData.student_phone, formData.room_number)
      setSubmittedTicket(finalTicket)
    } catch (err) {
      console.error('Submission error:', err)
      setErrorMessage(err.message || 'Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
      setUploadProgress('')
    }
  }

  const copyTicket = () => {
    if (!submittedTicket) return
    navigator.clipboard.writeText(submittedTicket)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Success Confirmation Screen
  if (submittedTicket) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xl border border-white/90">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Logged Successfully!</h2>
            <p className="text-xs text-slate-500">
              Your request has been registered in the campus hostel portal. Maintenance team has been notified.
            </p>
          </div>

          {/* Ticket Number Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
              Auto-Assigned Ticket ID
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-wider">
                {submittedTicket}
              </span>
              <button
                onClick={copyTicket}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                title="Copy ticket number"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-indigo-600 font-medium">
              {copied ? 'Copied to clipboard!' : 'Automatically assigned to your live tracking session'}
            </p>
          </div>

          <div className="text-left text-xs text-slate-600 space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between">
              <span className="text-slate-400">Student:</span>
              <span className="text-slate-800 font-semibold">{formData.student_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hostel & Room:</span>
              <span className="text-slate-800 font-semibold">{formData.hostel_block} - Room {formData.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type / Urgency:</span>
              <span className="text-slate-800 font-semibold">{formData.complaint_type} ({formData.urgency})</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/track?query=${submittedTicket}`}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <span>Track Live Status (Auto-Filled)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                setSubmittedTicket(null)
                setFormData({
                  student_name: '',
                  student_phone: '',
                  student_roll_no: '',
                  hostel_block: HOSTEL_BLOCKS[0],
                  room_number: '',
                  complaint_type: 'Maintenance',
                  category: 'Room Maintenance',
                  urgency: 'Normal',
                  title: '',
                  description: '',
                })
                handleRemoveImage()
              }}
              className="py-3 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-semibold shadow-2xs">
          <Building2 className="w-3.5 h-3.5" />
          <span>Campus Complaint Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          File a Maintenance Request
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Fill in student details, hostel room, and issue description. Our campus facility crew will be dispatched accordingly.
        </p>
      </div>

      {/* EMERGENCY QUICK-FILLER PRESETS */}
      <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-rose-50/70 border border-rose-200/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                1-Click Emergency Filler
              </h3>
              <p className="text-[11px] text-rose-700">
                Facing an urgent hazard? Click any preset to instantly auto-fill the complaint form
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-200">
            Instant Dispatch
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMERGENCY_PRESETS.map((preset) => {
            const Icon = preset.icon
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyEmergencyPreset(preset)}
                className="p-2.5 rounded-xl bg-white/90 hover:bg-white text-left border border-rose-200/90 hover:border-rose-400 hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-xs mb-0.5">
                  <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>{preset.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{preset.type}</p>
              </button>
            )
          })}
        </div>

        {presetNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{presetNotice}</span>
          </div>
        )}
      </div>

      {/* Rate Limiting Active Banner */}
      {rateLimitState.isLimited && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900">Rate Limit In Effect</h4>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              To prevent duplicate and spam requests, there is a limit of 3 complaints per 15 minutes. Please wait{' '}
              <strong className="text-amber-950 font-mono">{formatRemainingTime(rateLimitState.remainingSeconds)}</strong> before submitting another request.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Form Container with Glassmorphism */}
      <form onSubmit={handleSubmit} className="space-y-8 glass-panel rounded-3xl p-6 sm:p-8 shadow-lg border border-white/90">
        {/* SECTION 1: Student Information */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              1. Student Details
            </h3>
            <p className="text-[11px] text-slate-500">Used for verification and contact by maintenance technicians</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleInputChange}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700">
                Phone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="student_phone"
                value={formData.student_phone}
                onChange={handleInputChange}
                placeholder="10-digit mobile number"
                required
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-semibold text-slate-700">
                Roll No / Student ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="student_roll_no"
                value={formData.student_roll_no}
                onChange={handleInputChange}
                placeholder="e.g. 21BCE1042"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Location / Hostel Block */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              2. Hostel Block & Room Location
            </h3>
            <p className="text-[11px] text-slate-500">Select which hostel and room requires service</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Hostel Block <span className="text-rose-500">*</span>
              </label>
              <select
                name="hostel_block"
                value={formData.hostel_block}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 cursor-pointer font-medium"
              >
                {HOSTEL_BLOCKS.map(block => (
                  <option key={block} value={block} className="bg-white text-slate-900">
                    {block}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Room Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="room_number"
                value={formData.room_number}
                onChange={handleInputChange}
                placeholder="e.g. 204 or Block-B 102"
                required
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Complaint Type, Category & Priority */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-600" />
              3. Issue Classification & Urgency
            </h3>
            <p className="text-[11px] text-slate-500">Classify the problem to assign the right specialist</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Complaint Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="complaint_type"
                value={formData.complaint_type}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 cursor-pointer font-medium"
              >
                {COMPLAINT_TYPES.map(type => (
                  <option key={type} value={type} className="bg-white text-slate-900">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Location Area / Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 cursor-pointer font-medium"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-white text-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Urgency Pill Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700">
              Urgency Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {URGENCY_LEVELS.map(lvl => {
                const selected = formData.urgency === lvl.value
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, urgency: lvl.value }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? `${lvl.color} ring-2 ring-indigo-500/30 shadow-xs scale-[1.02]`
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs">{lvl.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{lvl.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4: Description & Optional Image Upload */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              4. Issue Details & Attachment
            </h3>
            <p className="text-[11px] text-slate-500">Provide clear info to help the team resolve it faster</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Short Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={120}
              placeholder="e.g. Ceiling fan not spinning at full speed, strange humming sound"
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Explain exactly where and what the issue is, since when it started, and any safety concerns..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-900 placeholder-slate-400 leading-relaxed"
            />
          </div>

          {/* Optional Image Upload */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Attach Photo</span>
                <span className="text-[11px] text-slate-400 font-normal">(Optional, max 5MB)</span>
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white/70 hover:bg-white rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Click to browse or drag and drop a photo
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  JPG, PNG, or WebP up to 5MB (stored in Supabase complaint-attachments bucket)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-2 max-w-sm shadow-sm">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-44 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500">
            By submitting, your complaint will be logged with an auto-assigned tracking ID.
          </div>

          <button
            type="submit"
            disabled={submitting || rateLimitState.isLimited}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              submitting || rateLimitState.isLimited
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 active:scale-95'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress || 'Submitting Complaint...'}</span>
              </>
            ) : rateLimitState.isLimited ? (
              <>
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Rate Limited ({formatRemainingTime(rateLimitState.remainingSeconds)})</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
