import { createClient } from '@supabase/supabase-js';

// Debugging: Hardcoded to rule out Env issues
const supabaseUrl = "https://mafhukcwhlsgqhqhyvlk.supabase.co";
const supabaseKey = "sb_publishable_SdyRjDpbp9xcYIAoCO1K3A_y63EEEXK";

export const supabase = createClient(supabaseUrl, supabaseKey);
