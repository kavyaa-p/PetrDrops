import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxlrhghmrxyhndmtalcb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Fix for Vite
export const supabase = createClient(supabaseUrl, supabaseKey);
