import "server-only";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_PUBLISHABLE_KEY: string | undefined;
  PLATFORM_ENCRYPTION_KEY: string;
  APP_URL: string;
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const required = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "PLATFORM_ENCRYPTION_KEY"] as const;
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  cached = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY!,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    PLATFORM_ENCRYPTION_KEY: process.env.PLATFORM_ENCRYPTION_KEY!,
    APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  };
  return cached;
}
