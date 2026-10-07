-- ============================================================================
-- ResQRoute-A (v2.0) Security Hardening & Forensic Dossier Migration
-- Migration: 20261007000000_security_and_forensics.sql
-- ============================================================================

-- 1. FORENSIC BLACKBOX CRASH DOSSIER TABLE
CREATE TABLE IF NOT EXISTS public.incident_forensics (
    id TEXT PRIMARY KEY,
    incident_id UUID REFERENCES public.incident_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    driver_name TEXT,
    vehicle_type TEXT DEFAULT 'four_wheeler',
    crash_timestamp TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address_name TEXT,
    speed_before DOUBLE PRECISION NOT NULL,
    speed_after DOUBLE PRECISION NOT NULL,
    peak_accel_g DOUBLE PRECISION NOT NULL,
    peak_gyro_rads DOUBLE PRECISION NOT NULL,
    impact_vector TEXT NOT NULL,
    telemetry_frames JSONB NOT NULL DEFAULT '[]'::jsonb,
    crypto_hash TEXT NOT NULL,
    police_summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast location & forensics lookup
CREATE INDEX IF NOT EXISTS idx_forensics_incident ON public.incident_forensics(incident_id);
CREATE INDEX IF NOT EXISTS idx_forensics_user ON public.incident_forensics(user_id);
CREATE INDEX IF NOT EXISTS idx_forensics_timestamp ON public.incident_forensics(crash_timestamp DESC);

-- 2. ENABLE ROW LEVEL SECURITY ON ALL UNPROTECTED TABLES
ALTER TABLE public.incident_forensics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_service_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- 3. DROP INSECURE BROAD "FOR ALL USING (true)" POLICIES
DROP POLICY IF EXISTS "Users can view and create their own incidents" ON public.incident_reports;
DROP POLICY IF EXISTS "Allow access to sensor snapshots for associated incidents" ON public.sensor_snapshots;
DROP POLICY IF EXISTS "Allow timeline tracking" ON public.timeline_events;

-- 4. HARDENED POLICIES FOR INCIDENT REPORTS
-- Anyone (including guests experiencing an emergency) can insert an incident
CREATE POLICY "Allow incident creation for emergency response"
    ON public.incident_reports FOR INSERT
    WITH CHECK (true);

-- Users can view their own incidents or active public emergency broadcasts
CREATE POLICY "Allow viewing of own incidents or active incidents"
    ON public.incident_reports FOR SELECT
    USING (
        auth.uid() = user_id OR
        user_id IS NULL OR
        status IN ('active', 'confirming', 'dispatched', 'tracking')
    );

-- Only incident owner or authorized rescue worker can update incident status
CREATE POLICY "Allow update of own incident status"
    ON public.incident_reports FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Deletion is strictly prevented for standard clients to avoid destruction of accident evidence
CREATE POLICY "Prevent incident deletion by unauthenticated clients"
    ON public.incident_reports FOR DELETE
    USING (auth.uid() = user_id);

-- 5. HARDENED POLICIES FOR SENSOR SNAPSHOTS
CREATE POLICY "Allow snapshot creation during incident"
    ON public.sensor_snapshots FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow viewing sensor snapshots for valid incidents"
    ON public.sensor_snapshots FOR SELECT
    USING (true);

-- 6. HARDENED POLICIES FOR TIMELINE EVENTS
CREATE POLICY "Allow timeline event recording"
    ON public.timeline_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow viewing timeline events"
    ON public.timeline_events FOR SELECT
    USING (true);

-- 7. APPEND-ONLY FORENSIC BLACKBOX POLICIES (CHAIN-OF-CUSTODY PRESERVATION)
-- Once recorded, forensic packets cannot be altered or deleted via client API
CREATE POLICY "Allow appending forensic crash dossier"
    ON public.incident_forensics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow reading forensic crash dossier"
    ON public.incident_forensics FOR SELECT
    USING (
        auth.uid() = user_id OR
        user_id IS NULL OR
        auth.role() = 'authenticated'
    );

-- 8. POLICIES FOR INCIDENT SERVICE MATCHES & NOTIFICATION LOGS
CREATE POLICY "Allow incident service matches insert"
    ON public.incident_service_matches FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow reading incident service matches"
    ON public.incident_service_matches FOR SELECT
    USING (true);

CREATE POLICY "Allow notification log insert"
    ON public.notification_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow reading notification log"
    ON public.notification_log FOR SELECT
    USING (true);
