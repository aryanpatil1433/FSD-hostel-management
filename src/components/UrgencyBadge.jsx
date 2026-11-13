import React from 'react'
import { AlertCircle, AlertTriangle, Flame } from 'lucide-react'

const urgencyConfig = {
  Low: {
    color: 'bg-slate-100 text-slate-700 border-slate-200/90',
    icon: AlertCircle,
  },
  Normal: {
    color: 'bg-blue-50 text-blue-700 border-blue-200/90',
    icon: AlertCircle,
  },
  High: {
    color: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
    icon: AlertTriangle,
  },
  Emergency: {
    color: 'bg-rose-50 text-rose-700 border-rose-200/90 font-bold animate-pulse',
    icon: Flame,
  },
}

export default function UrgencyBadge({ urgency }) {
  const config = urgencyConfig[urgency] || urgencyConfig.Normal
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] border shadow-2xs ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{urgency} Priority</span>
    </span>
  )
}
