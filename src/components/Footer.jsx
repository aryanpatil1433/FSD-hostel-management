import React from 'react'
import { Building2, Wrench, PhoneCall, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-md text-slate-600 text-xs">
      {/* Quick info bar */}
      <div className="border-b border-slate-100 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">24/7 Portal</p>
              <p className="text-[11px] text-slate-500">Log issues anytime</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Quick Dispatch</p>
              <p className="text-[11px] text-slate-500">Priority for emergency</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">All Blocks Covered</p>
              <p className="text-[11px] text-slate-500">Boys 1-2 & Girls 1-2</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Emergency Desk</p>
              <p className="text-[11px] text-slate-500">Internal Ext: 104 / 105</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">Campus Hostel Management System</span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-slate-500">Complaints & Facilities Maintenance</span>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Designed for high-reliability campus maintenance. Powered by Supabase.
        </p>
      </div>
    </footer>
  )
}
