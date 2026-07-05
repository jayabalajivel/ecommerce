import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqrnocbgthuqgqdtfblg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxcm5vY2JndGh1cWdxZHRmYmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3OTQ0MzcsImV4cCI6MjA5ODM3MDQzN30.du94O-DQz3rwXVyLvYt3mws6gIHx_rOoxqhaZgdrBPs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
