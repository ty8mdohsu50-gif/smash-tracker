import { createClient } from "@supabase/supabase-js";

// The anon key is safe to embed: Supabase RLS gates all reads/writes.
// Keeping an explicit fallback so the bundle never crashes at module
// load time if VITE_* env vars happen to be missing in a build env
// (e.g., Cloudflare Pages without env configured).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ozdrrtjvtisbenmqygtz.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96ZHJydGp2dGlzYmVubXF5Z3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQwNDgsImV4cCI6MjA5MDgwMDA0OH0.7XFFO4c01IoPbEpsj92FHV8SNddQ0LrXmDNGQmoeK8U";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
