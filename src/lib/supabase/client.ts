import { createClient } from "@supabase/supabase-js";

// Enterprise Architecture: Connects the Next.js Edge / Client directly to Supabase resources.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);
