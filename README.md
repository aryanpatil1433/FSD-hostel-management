# 🏢 CampusHostel - Complaint & Facilities Management Portal

A modern, production-grade Single Page Application (SPA) built with **React**, **Tailwind CSS**, **Lucide Icons**, and **Supabase** for managing hostel maintenance requests and issue tracking across campus residential wings.

---

## ✨ Features

- **💎 Light Glassmorphism UI/UX**: Crisp, clean light aesthetic with frosted translucent panels, specular highlights, high-contrast typography, and smooth micro-interactions.
- **⚡ 1-Click Emergency Quick-Filler**: Immediate autofill presets for urgent situations:
  - 🚨 *Water Pipe Burst / Flooding* (Plumbing, Bathroom/Washroom, Emergency)
  - ⚡ *Short Circuit / Sparks* (Electrical, Room Maintenance, Emergency)
  - 🔒 *Door Lock Jammed / Locked Out* (Carpentry, Room Maintenance, High/Emergency)
  - 💨 *Hazardous Smell / Gas* (Safety/Security, Emergency)
- **🎯 Auto-Assigned Ticket ID in Search**:
  - Automatically captures the generated Ticket ID upon submission.
  - Auto-fills the search input on the Tracking page (`/track`) and Home page with 1-click access so students don't need to manually retype or copy-paste long ticket numbers.
- **📍 Multi-Block Campus Support**:
  - `Boys Hostel 1`
  - `Boys Hostel 2`
  - `Girls Hostel 1`
  - `Girls Hostel 2`
- **🏷️ Structured Classifications**:
  - **Complaint Types**: Maintenance, Electrical, Plumbing, Carpentry, Cleaning/Sanitation, Internet/WiFi, Appliance/AC, Security/Noise, Other.
  - **Location Categories**: Room Maintenance, Common Area, Bathroom/Washroom, Mess/Dining, Corridor/Lobby, Other.
  - **Urgency Levels**: Low, Normal, High, Emergency (with instant dispatch indicators).
- **📸 Optional Photo Attachments**: Seamless drag-and-drop or file upload stored in a dedicated Supabase Storage bucket (`complaint-attachments`).
- **🛡️ Multi-Layer Rate Limiting**:
  - **Database Level**: Custom PostgreSQL trigger and stored procedure (`check_complaint_rate_limit`) in `supabase_schema.sql` that enforces a strict maximum of **3 complaints per 15 minutes** per student phone number and 5 per room.
  - **Client Level**: Real-time sliding window timer with friendly cooldown countdown banner.
- **🔍 Real-Time Status Tracking**: Dynamic routes (`/track`, `/track/:ticketId`, or `/complaint/:ticketId`) supporting lookup by **Ticket ID** (e.g., `HCP-2026-XXXX`) or **Phone Number**, complete with visual 4-step progress workflow and audit history log.
- **📊 Warden / Staff Dashboard**:
  - Passcode protected (`warden2026`, configurable via `.env`).
  - Metric counters (Total, Pending, In Progress, Resolved, Emergency).
  - Multi-criteria filtering by Hostel Block, Status, and Type.
  - Quick-update modal to change status, assign technician, and log resolution notes.
  - One-click CSV Export for daily physical maintenance rounds.

---

## 🚀 Quick Setup Instructions (For You & Your Friend)

### Step 1: Run the All-In-One SQL File in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab from the left sidebar.
3. Open `supabase_schema.sql` from this project, copy the entire file contents, paste into the SQL Editor, and click **Run**.
4. This will automatically create:
   - The `complaints` table with all indexes and constraints.
   - The `complaint_updates` timeline log table.
   - The `complaint-attachments` public storage bucket.
   - Database-level rate limiting functions & triggers.
   - Row Level Security (RLS) policies for inserts, updates, and storage access.

---

### Step 2: Configure Environment Credentials
1. In your Supabase Project, go to **Project Settings** → **API**.
2. Copy your **Project URL** and **anon public key**.
3. Open `.env` (or copy from `.env.example`) and fill in:

```env
# Your Supabase Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase Anon Public Key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Master Passcode for Hostel Warden / Admin Dashboard
VITE_ADMIN_PASSCODE=warden2026
```

---

### Step 3: Start the Development Server
Run the following commands in the project folder:

```bash
# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🗂️ Project Directory Structure

```text
├── supabase_schema.sql      # All-in-one database, storage, RLS & rate limit script
├── .env.example             # Documented environment template
├── .env                     # Local credentials file (gitignored)
├── index.html               # Main entry HTML
├── vite.config.js           # Vite + Tailwind v4 configuration
├── package.json             # Dependencies & scripts
└── src/
    ├── main.jsx             # React entrypoint
    ├── App.jsx              # Router & route definitions
    ├── index.css            # Tailwind CSS & light glassmorphic theme
    ├── lib/
    │   ├── supabase.js      # Supabase client initialization & helper
    │   ├── storage.js       # Image upload to 'complaint-attachments' bucket
    │   ├── rateLimiter.js   # Client-side rate limiting & cooldown calculations
    │   └── constants.js     # Hostel blocks, categories, urgency levels
    ├── components/
    │   ├── Navbar.jsx       # Header with logo, links, & Supabase status indicator
    │   ├── Footer.jsx       # Minimalist footer with campus emergency contacts
    │   ├── StatusBadge.jsx  # Color-coded micro badges
    │   ├── UrgencyBadge.jsx # Urgency priority indicators
    │   └── SupabaseAlert.jsx# Setup banner when credentials are not yet configured
    └── pages/
        ├── Home.jsx         # Hero, quick search, live counters & category shortcuts
        ├── SubmitComplaint.jsx # Form with student info, 1-click emergency filler, optional photo
        ├── TrackComplaint.jsx  # Status tracker with auto-assigned ticket & 4-step timeline
        └── AdminDashboard.jsx  # Warden control panel with filters, quick update modal, & CSV export
```
