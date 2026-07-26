import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://iftdrbxvekrhzstayjwp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmdGRyYnh2ZWtyaHpzdGF5andwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mzc5OTksImV4cCI6MjA5OTQxMzk5OX0.7nyvQlO5IDI6E4dLYHl6yrqqaNd53RxJcDOTQ7yNh40";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// NOTE: This project points at an external Supabase whose schema is not
// reflected in the local generated `types.ts` (which only covers the Lovable
// Cloud boards tables). Using the generated `Database` type here breaks every
// query against the external schema. We intentionally type the client loosely.
export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});