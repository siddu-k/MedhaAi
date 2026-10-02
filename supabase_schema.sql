-- ============================================================
-- TYLOOP AI — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  educational_level TEXT,
  study_goals TEXT,
  avatar_url TEXT,
  avatar_customization JSONB DEFAULT '{}'::jsonb,
  preferred_ai_model TEXT DEFAULT 'gemini-3.5-flash-lite',
  voice_settings JSONB DEFAULT '{"pitch": 1.0, "rate": 1.0, "voice": "default"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CHAT SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Session',
  mode TEXT DEFAULT 'chat' CHECK (mode IN ('chat', 'visualize', 'visualize2d', 'visualize3d', 'ppt', 'quiz', 'interview')),
  model_used TEXT DEFAULT 'gemini-3.5-flash-lite',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. CHAT MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. VISUAL BOARDS TABLE (2D Diagrams & 3D Spatial Scenes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.visual_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  board_type TEXT NOT NULL CHECK (board_type IN ('2d_mermaid', '3d_spatial')),
  code_content TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. QUIZZES & ASSESSMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL,
  score INTEGER,
  total_questions INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. SLIDE DECKS TABLE (PPT Studio)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ppt_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  slides JSONB NOT NULL,
  theme TEXT DEFAULT 'modern',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. STORAGE BUCKET FOR USER DOCUMENTS & ASSETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow all operations for documents" ON storage.objects;
CREATE POLICY "Allow all operations for documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');
