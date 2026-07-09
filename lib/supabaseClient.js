import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaces a clear error in the browser console instead of a cryptic one
  // if someone forgets to fill in .env.local.
  console.warn(
    "Supabase env vars are missing. Copy .env.local.example to .env.local and fill in your project URL + anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: restrict signups to a school email domain.
// Leave empty to allow any email. Example: "university.edu"
export const ALLOWED_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "";

export function isAllowedEmail(email) {
  if (!ALLOWED_EMAIL_DOMAIN) return true;
  return email.toLowerCase().endsWith("@" + ALLOWED_EMAIL_DOMAIN.toLowerCase());
}
