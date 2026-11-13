import React from 'react'
import { Clock, Eye, Wrench, CheckCircle2, XCircle, Archive } from 'lucide-react'

const statusConfig = {
  Submitted: {
    color: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-xs',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  'In Review': {
    color: 'bg-indigo-50 text-indigo-800 border-indigo-200/80 shadow-xs',
    dot: 'bg-indigo-600',
    icon: Eye,
  },
  'In Progress': {
    color: 'bg-sky-50 text-sky-800 border-sky-200/80 shadow-xs',
    dot: 'bg-sky-500 animate-pulse',
    icon: Wrench,
  },
  Resolved: {
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-xs',
    dot: 'bg-emerald-600',
    icon: CheckCircle2,
  },
  Closed: {
    color: 'bg-slate-100 text-slate-700 border-slate-200 shadow-xs',
    dot: 'bg-slate-500',
    icon: Archive,
  },
  Rejected: {
    color: 'bg-rose-50 text-rose-800 border-rose-200/80 shadow-xs',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.Submitted
  const Icon = config.icon

  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1.5 text-xs font-semibold gap-2' 
    : 'px-2.5 py-1 text-[11px] font-semibold gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${config.color} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{status}</span>
    </span>
  )
}
