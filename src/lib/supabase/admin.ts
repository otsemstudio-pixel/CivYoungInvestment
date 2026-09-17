import { createClient } from "@supabase/supabase-js";

/**
 * Client service_role : contourne RLS. Réservé aux tâches serveur qui
 * doivent agir au nom de tous les utilisateurs (cron). Ne jamais exposer
 * côté client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
