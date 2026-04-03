import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.VITE_SUPABASE_URL; // We'll get from .env
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Actually I'll use node to fetch directly
