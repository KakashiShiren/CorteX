export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
};

export const hasSupabaseBrowserEnv =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const hasSupabaseServiceEnv =
  hasSupabaseBrowserEnv &&
  Boolean(env.supabaseServiceKey);

export const hasSupabaseEnv =
  hasSupabaseServiceEnv;

export const hasGoogleMapsEnv =
  Boolean(env.googleMapsApiKey);

export const hasGroqEnv = Boolean(env.groqApiKey);
