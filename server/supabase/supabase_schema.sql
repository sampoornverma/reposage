-- Supabase Database Schema for RepoSage
-- This file contains all table definitions, indexes, and RLS policies required to run the application.

-- 1. Enable the pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the profiles table for Auth and Waitlist Management
CREATE TABLE public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  is_approved boolean default false,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles (used by Admin Dashboard)
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile on signup
CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to update ANY profile (e.g., to approve them from the dashboard)
CREATE POLICY "Admins can update profiles." ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Trigger to automatically create a profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_approved, is_admin)
  VALUES (
    new.id, 
    new.email, 
    false, -- users are NOT approved by default
    false  -- users are NOT admin by default
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create the repositories table
CREATE TABLE public.repositories (
  id uuid default gen_random_uuid() primary key,
  github_url text not null,
  repo_name text not null,
  branch text default 'main',
  status text default 'pending', -- pending, indexing, completed, failed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create the chunks table to store AST-parsed code snippets and embeddings
CREATE TABLE public.chunks (
  id uuid default gen_random_uuid() primary key,
  repository_id uuid references public.repositories(id) on delete cascade not null,
  file_path text not null,
  content text not null,
  start_line integer,
  end_line integer,
  embedding vector(1536) -- OpenAI text-embedding-3-small generates 1536 dimensions
);

-- 5. Create the IVFFlat index for fast vector similarity search
-- Setting lists=100 as an optimal balance between accuracy and speed for codebase chunks
CREATE INDEX ON public.chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Create the BM25 Full-Text Search index for hybrid keyword matching
CREATE INDEX idx_chunks_content_fts ON public.chunks USING gin (to_tsvector('english', content));

-- NOTE: To make yourself an admin, run this command manually in the SQL editor:
-- UPDATE public.profiles SET is_admin = true, is_approved = true WHERE email = 'YOUR_EMAIL@DOMAIN.COM';
