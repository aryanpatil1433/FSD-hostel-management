-- ==============================================================================
-- HOSTEL COMPLAINT MANAGEMENT SYSTEM - SUPABASE ALL-IN-ONE SETUP SCRIPT
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Go to the "SQL Editor" tab from the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- 4. That's it! Tables, Storage Bucket, Policies, and Triggers will be ready.
-- ==============================================================================

-- 1. CREATE EXTENSIONS (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    student_roll_no TEXT,
    hostel_block TEXT NOT NULL CHECK (hostel_block IN ('Boys Hostel 1', 'Boys Hostel 2', 'Girls Hostel 1', 'Girls Hostel 2')),
    room_number TEXT NOT NULL,
    complaint_type TEXT NOT NULL CHECK (complaint_type IN (
        'Maintenance',
        'Electrical',
        'Plumbing',
        'Carpentry',
        'Cleaning/Sanitation',
        'Internet/WiFi',
        'Appliance/AC',
        'Security/Noise',
        'Other'
    )),
    category TEXT NOT NULL DEFAULT 'Room Maintenance' CHECK (category IN (
        'Room Maintenance',
        'Common Area',
        'Bathroom/Washroom',
        'Mess/Dining',
        'Corridor/Lobby',
        'Other'
    )),
    urgency TEXT NOT NULL DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'High', 'Emergency')),
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT, -- Optional attached image URL
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN (
        'Submitted',
        'In Review',
        'In Progress',
        'Resolved',
        'Closed',
        'Rejected'
    )),
    assigned_to TEXT DEFAULT 'Campus Maintenance Cell',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE COMPLAINT UPDATES / TIMELINE AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_by TEXT DEFAULT 'Hostel Administration',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_number ON public.complaints (ticket_number);
CREATE INDEX IF NOT EXISTS idx_complaints_hostel_block ON public.complaints (hostel_block);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_student_phone ON public.complaints (student_phone);
CREATE INDEX IF NOT EXISTS idx_complaints_room ON public.complaints (hostel_block, room_number);
CREATE INDEX IF NOT EXISTS idx_updates_complaint_id ON public.complaint_updates (complaint_id);

-- ==============================================================================
-- 4. DATABASE-LEVEL RATE LIMITING FUNCTION & TRIGGER
-- Prevents spam submissions: Max 3 complaints from the same phone or room in 15 minutes.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_complaint_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_phone_count INT;
    recent_room_count INT;
BEGIN
    -- Count complaints submitted by this phone in the last 15 minutes
    SELECT COUNT(*) INTO recent_phone_count
    FROM public.complaints
    WHERE student_phone = NEW.student_phone
      AND created_at >= (NOW() - INTERVAL '15 minutes');

    IF recent_phone_count >= 3 THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: You have reached the maximum limit of 3 complaints per 15 minutes for this phone number. Please try again later.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Count complaints submitted for this specific room in the last 15 minutes
    SELECT COUNT(*) INTO recent_room_count
    FROM public.complaints
    WHERE hostel_block = NEW.hostel_block
      AND room_number = NEW.room_number
      AND created_at >= (NOW() - INTERVAL '15 minutes');

    IF recent_room_count >= 5 THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: Maximum 5 complaints allowed per room within 15 minutes. Please wait before submitting another complaint.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_rate_limit_complaints ON public.complaints;
CREATE TRIGGER trigger_rate_limit_complaints
BEFORE INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.check_complaint_rate_limit();

-- ==============================================================================
-- 5. AUTO-GENERATED TICKET NUMBER & TIMELINE INITIALIZATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_complaint_ticket_and_log()
RETURNS TRIGGER AS $$
DECLARE
    year_str TEXT;
    random_code TEXT;
BEGIN
    -- Auto-generate ticket if not provided
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        year_str := TO_CHAR(NOW(), 'YYYY');
        random_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
        NEW.ticket_number := 'HCP-' || year_str || '-' || random_code;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prepare_complaint ON public.complaints;
CREATE TRIGGER trigger_prepare_complaint
BEFORE INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.generate_complaint_ticket_and_log();

-- Trigger to log initial status and subsequent status updates
CREATE OR REPLACE FUNCTION public.log_complaint_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.complaint_updates (complaint_id, previous_status, new_status, note, updated_by)
        VALUES (
            NEW.id,
            NULL,
            NEW.status,
            'Complaint registered and logged into Campus Management Portal.',
            'System'
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.complaint_updates (complaint_id, previous_status, new_status, note, updated_by)
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.resolution_notes, 'Status changed to ' || NEW.status),
            'Hostel Administration'
        );
        NEW.updated_at := NOW();
        IF NEW.status IN ('Resolved', 'Closed') AND NEW.resolved_at IS NULL THEN
            NEW.resolved_at := NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_complaint_history ON public.complaints;
CREATE TRIGGER trigger_log_complaint_history
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.log_complaint_status_history();

-- ==============================================================================
-- 6. STORAGE BUCKET CONFIGURATION (One bucket for optional complaint photos)
-- ==============================================================================
-- Insert the public bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-attachments',
    'complaint-attachments',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

-- Complaints: Public can read all complaints (for tracking & dashboard view)
DROP POLICY IF EXISTS "Public can view complaints" ON public.complaints;
CREATE POLICY "Public can view complaints"
ON public.complaints FOR SELECT
USING (true);

-- Complaints: Public can insert complaints (subject to rate limit trigger)
DROP POLICY IF EXISTS "Public can insert complaints" ON public.complaints;
CREATE POLICY "Public can insert complaints"
ON public.complaints FOR INSERT
WITH CHECK (true);

-- Complaints: Allow update of complaints (for status changes & admin resolution)
DROP POLICY IF EXISTS "Allow complaints update" ON public.complaints;
CREATE POLICY "Allow complaints update"
ON public.complaints FOR UPDATE
USING (true)
WITH CHECK (true);

-- Complaint Updates: Anyone can view updates for a complaint
DROP POLICY IF EXISTS "Public can view complaint updates" ON public.complaint_updates;
CREATE POLICY "Public can view complaint updates"
ON public.complaint_updates FOR SELECT
USING (true);

-- Complaint Updates: Allow inserting updates
DROP POLICY IF EXISTS "Public can insert complaint updates" ON public.complaint_updates;
CREATE POLICY "Public can insert complaint updates"
ON public.complaint_updates FOR INSERT
WITH CHECK (true);

-- Storage Policies for 'complaint-attachments' bucket
DROP POLICY IF EXISTS "Public access to complaint attachments" ON storage.objects;
CREATE POLICY "Public access to complaint attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-attachments');

DROP POLICY IF EXISTS "Public can upload complaint attachments" ON storage.objects;
CREATE POLICY "Public can upload complaint attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'complaint-attachments');

DROP POLICY IF EXISTS "Public can update complaint attachments" ON storage.objects;
CREATE POLICY "Public can update complaint attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'complaint-attachments');

-- ==============================================================================
-- DONE! Your Supabase database is now fully prepared for Hostel Complaint Portal.
-- ==============================================================================
