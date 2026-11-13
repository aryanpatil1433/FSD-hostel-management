import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Building2, 
  PlusCircle, 
  Search, 
  LayoutDashboard, 
  Menu, 
  X, 
  PhoneCall,
  Database
} from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Navbar() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isConnected = isSupabaseConfigured()

  const navLinks = [
    { name: 'Submit Issue', path: '/submit', icon: PlusCircle },
    { name: 'Track Status', path: '/track', icon: Search },
    { name: 'Hostel Dashboard', path: '/admin', icon: LayoutDashboard },
  ]

  const isActive = (path) => {
    if (path === '/track') {
      return location.pathname.startsWith('/track') || location.pathname.startsWith('/complaint')
    }
    return location.pathname === path
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">CampusHostel</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Student Care & Maintenance</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right utility items */}
          <div className="hidden md:flex items-center gap-3">
            {/* Supabase status badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
              }`}
              title={isConnected ? 'Connected to live Supabase database' : 'Running in local preview mode - configure .env to connect'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Database className="w-3 h-3" />
              <span>{isConnected ? 'Supabase Live' : 'Offline'}</span>
            </div>

            {/* Quick emergency contact link */}
            <a
              href="tel:100"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
              title="Hostel Warden Emergency Helpline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-mono text-[11px]">Helpline</span>
            </a>

            {/* Primary Action Button */}
            <Link
              to="/submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Complaint</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-2 pb-5 space-y-2 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-indigo-600" />
                {link.name}
              </Link>
            )
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Submit New Complaint
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
