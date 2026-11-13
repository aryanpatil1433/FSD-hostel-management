export const HOSTEL_BLOCKS = [
  'Boys Hostel 1',
  'Boys Hostel 2',
  'Girls Hostel 1',
  'Girls Hostel 2',
]

export const COMPLAINT_TYPES = [
  'Maintenance',
  'Electrical',
  'Plumbing',
  'Carpentry',
  'Cleaning/Sanitation',
  'Internet/WiFi',
  'Appliance/AC',
  'Security/Noise',
  'Other',
]

export const CATEGORIES = [
  'Room Maintenance',
  'Common Area',
  'Bathroom/Washroom',
  'Mess/Dining',
  'Corridor/Lobby',
  'Other',
]

export const URGENCY_LEVELS = [
  { value: 'Low', label: 'Low', desc: 'Minor issue, cosmetic fix', color: 'text-slate-400 bg-slate-800/60 border-slate-700' },
  { value: 'Normal', label: 'Normal', desc: 'Standard turnaround (24-48 hrs)', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60' },
  { value: 'High', label: 'High', desc: 'Disrupts daily routine (same-day)', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' },
  { value: 'Emergency', label: 'Emergency', desc: 'Immediate risk (leakage, sparks)', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60' },
]

export const STATUS_LIST = [
  'Submitted',
  'In Review',
  'In Progress',
  'Resolved',
  'Closed',
  'Rejected',
]
