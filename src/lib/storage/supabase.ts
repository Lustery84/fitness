import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}

export function getSupabasePublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

let browserClient: SupabaseClient | null = null;
let runtimeUrl = "";
let runtimeKey = "";

export function setBrowserSupabaseConfig(url: string, publicKey: string) {
  const cleanUrl = url.trim();
  const cleanKey = publicKey.trim();
  if (cleanUrl && cleanKey && (cleanUrl !== runtimeUrl || cleanKey !== runtimeKey)) {
    runtimeUrl = cleanUrl;
    runtimeKey = cleanKey;
    browserClient = createClient(cleanUrl, cleanKey);
  }
}

export function getBrowserSupabase(): SupabaseClient | null {
  const url = runtimeUrl || getSupabaseUrl();
  const key = runtimeKey || getSupabasePublicKey();
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key);
  }
  return browserClient;
}

export function createUserScopedSupabase(accessToken: string): SupabaseClient | null {
  if (!isSupabaseConfigured() || !accessToken) return null;
  return createClient(getSupabaseUrl(), getSupabasePublicKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
