export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  geminiApiKey: process.env.GEMINI_API_KEY,
  smtpHost: process.env.SMTP_HOST ?? process.env.BREVO_SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? process.env.BREVO_SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? process.env.BREVO_SMTP_USER,
  smtpPass: process.env.SMTP_PASS ?? process.env.BREVO_SMTP_PASS ?? process.env.BREVO_SMTP_KEY,
  smtpFromEmail: process.env.SMTP_FROM_EMAIL ?? process.env.BREVO_SMTP_FROM_EMAIL,
  smtpFromName: process.env.SMTP_FROM_NAME ?? process.env.BREVO_SMTP_FROM_NAME ?? "Grove",
  verificationCodeSecret: process.env.VERIFICATION_CODE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  canvasClarkClientId: process.env.CANVAS_CLARK_CLIENT_ID,
  canvasClarkClientSecret: process.env.CANVAS_CLARK_CLIENT_SECRET,
  canvasNeuClientId: process.env.CANVAS_NEU_CLIENT_ID,
  canvasNeuClientSecret: process.env.CANVAS_NEU_CLIENT_SECRET,
  canvasNortheasternClientId: process.env.CANVAS_NORTHEASTERN_CLIENT_ID,
  canvasNortheasternClientSecret: process.env.CANVAS_NORTHEASTERN_CLIENT_SECRET,
  canvasWpiClientId: process.env.CANVAS_WPI_CLIENT_ID,
  canvasWpiClientSecret: process.env.CANVAS_WPI_CLIENT_SECRET,
  canvasBuClientId: process.env.CANVAS_BU_CLIENT_ID,
  canvasBuClientSecret: process.env.CANVAS_BU_CLIENT_SECRET,
  canvasHolyCrossClientId: process.env.CANVAS_HOLYCROSS_CLIENT_ID,
  canvasHolyCrossClientSecret: process.env.CANVAS_HOLYCROSS_CLIENT_SECRET
};

export const hasSupabaseBrowserEnv =
  Boolean(env.supabaseUrl) && Boolean(env.supabaseAnonKey);

export const hasSupabaseServiceEnv =
  hasSupabaseBrowserEnv &&
  Boolean(env.supabaseServiceRoleKey);

export const hasSupabaseEnv =
  hasSupabaseServiceEnv;

export const hasOpenAIEnv = Boolean(process.env.OPENAI_API_KEY);

export const hasGeminiEnv = Boolean(process.env.GEMINI_API_KEY);

export const hasSmtpEnv =
  Boolean(env.smtpHost) &&
  Number.isFinite(env.smtpPort) &&
  env.smtpPort > 0 &&
  Boolean(env.smtpUser) &&
  Boolean(env.smtpPass) &&
  Boolean(env.smtpFromEmail);

export const hasGoogleMapsEnv =
  Boolean(env.googleMapsApiKey);

export const hasGroqEnv = Boolean(process.env.GROQ_API_KEY);

export const hasStripeEnv =
  Boolean(env.stripeSecretKey) &&
  Boolean(env.stripePublishableKey);

export const hasStripeWebhookEnv =
  hasStripeEnv &&
  Boolean(env.stripeWebhookSecret);
