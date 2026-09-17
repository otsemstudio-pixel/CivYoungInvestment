import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./(auth)/actions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm text-foreground/70">Connecté en tant que</p>
      <p className="text-base font-medium text-foreground">{user.email}</p>
      <p className="max-w-xs text-sm text-foreground/60">
        Patrimoine, Objectifs et Moi arrivent dans les prochains jours de
        construction.
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="mt-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
