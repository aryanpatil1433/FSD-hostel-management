import React, { useState } from 'react'
import { Database, X, ChevronRight } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export default function SupabaseAlert() {
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const configured = isSupabaseConfigured()

  if (configured || dismissed) return null

  return (
    <>
      <div className="bg-amber-50/90 backdrop-blur-md border-b border-amber-200/80 py-2.5 px-4 text-xs text-amber-900 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold text-amber-950">Database Pending:</span>
            <span className="truncate text-amber-800">
              Add Supabase credentials to <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono border border-amber-200">.env</code> to enable live database writes & image uploads.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="text-amber-900 hover:text-indigo-600 font-semibold inline-flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Setup Guide <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-100/50 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Supabase Connection Setup</h3>
                <p className="text-xs text-slate-500">Connect the application in 2 minutes</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">1</span>
                  Run Database Script
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Open your Supabase project's SQL Editor and execute the script inside <code className="text-indigo-600 font-mono bg-indigo-50 px-1 py-0.5 rounded">supabase_schema.sql</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">2</span>
                  Copy API Credentials
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Go to Supabase <strong>Project Settings → API</strong>. Copy your <strong>Project URL</strong> and <strong>anon / public key</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">3</span>
                  Paste in .env file
                </div>
                <pre className="mt-1.5 p-2 rounded bg-slate-900 font-mono text-[10px] text-amber-200 overflow-x-auto">
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
                </pre>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Got it, close setup guide
            </button>
          </div>
        </div>
      )}
    </>
  )
}
