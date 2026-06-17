import { createClient } from "@supabase/supabase-js"

// ⚠️ Ce client utilise la clé service_role : il ne doit JAMAIS être importé
// dans un fichier "use client" ni exposé au navigateur. Utilisation uniquement
// dans les routes API (app/api/**/route.ts).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
