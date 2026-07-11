import { createClient } from "@supabase/supabase-js";

// N'utiliser que côté serveur (routes app/api/*) : la clé service_role
// contourne les policies RLS et ne doit jamais être envoyée au navigateur.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans les variables d'environnement");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
