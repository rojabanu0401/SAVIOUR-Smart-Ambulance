-- ==============================================================================
-- SAVIOUR: SMART AMBULANCE NETWORK - COMPLETE DATABASE MIGRATION & RLS POLICIES
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/guiqyispvleyjbxvvhkf/sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'common_user',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ADD MISSING COLUMNS TO PROFILES (SAFE & IDEMPOTENT)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'common_user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. CREATE AMBULANCES TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.ambulances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    license_number TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Advanced Life Support (ALS)',
    hospital_affiliation TEXT DEFAULT 'Central Emergency Dispatch Network',
    status TEXT NOT NULL DEFAULT 'available',
    is_active BOOLEAN NOT NULL DEFAULT true,
    latitude DOUBLE PRECISION DEFAULT 12.9352,
    longitude DOUBLE PRECISION DEFAULT 77.6245,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ADD MISSING COLUMNS TO AMBULANCES (SAFE & IDEMPOTENT)
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS driver_id UUID;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS vehicle_number TEXT;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Advanced Life Support (ALS)';
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT DEFAULT 'Central Emergency Dispatch Network';
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 12.9352;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 77.6245;
ALTER TABLE public.ambulances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. CREATE EMERGENCIES TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.emergencies (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 12.9716,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 77.5946,
    pickup_address TEXT NOT NULL DEFAULT 'Bengaluru Emergency Point',
    status TEXT NOT NULL DEFAULT 'pending',
    ambulance_id UUID,
    assigned_driver_id UUID,
    assigned_driver_name TEXT,
    assigned_driver_phone TEXT,
    assigned_ambulance_number TEXT,
    assigned_ambulance_type TEXT,
    hospital_affiliation TEXT,
    patient_condition TEXT DEFAULT 'Critical',
    emergency_type TEXT DEFAULT 'Medical Emergency',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ADD MISSING COLUMNS TO EMERGENCIES (SAFE & IDEMPOTENT)
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 12.9716;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 77.5946;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS pickup_address TEXT DEFAULT 'Bengaluru Emergency Point';
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS ambulance_id UUID;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS assigned_driver_id UUID;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS assigned_driver_name TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS assigned_driver_phone TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS assigned_ambulance_number TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS assigned_ambulance_type TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS patient_condition TEXT DEFAULT 'Critical';
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS emergency_type TEXT DEFAULT 'Medical Emergency';
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 5. GRANT PERMISSIONS TO ANON AND AUTHENTICATED ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Allow select profiles" ON public.profiles;
CREATE POLICY "Allow select profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
CREATE POLICY "Allow insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;
CREATE POLICY "Allow update profiles" ON public.profiles FOR UPDATE USING (true);

-- 8. RLS POLICIES FOR AMBULANCES
DROP POLICY IF EXISTS "Allow select ambulances" ON public.ambulances;
CREATE POLICY "Allow select ambulances" ON public.ambulances FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert ambulances" ON public.ambulances;
CREATE POLICY "Allow insert ambulances" ON public.ambulances FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update ambulances" ON public.ambulances;
CREATE POLICY "Allow update ambulances" ON public.ambulances FOR UPDATE USING (true);

-- 9. RLS POLICIES FOR EMERGENCIES
DROP POLICY IF EXISTS "Allow select emergencies" ON public.emergencies;
CREATE POLICY "Allow select emergencies" ON public.emergencies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert emergencies" ON public.emergencies;
CREATE POLICY "Allow insert emergencies" ON public.emergencies FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update emergencies" ON public.emergencies;
CREATE POLICY "Allow update emergencies" ON public.emergencies FOR UPDATE USING (true);

-- 10. REALTIME PUBLICATION SETUP
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'emergencies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ambulances'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;
