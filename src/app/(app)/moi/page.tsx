import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../../(auth)/actions";

export default async function MoiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-foreground/60">Connecté en tant que</p>
        <p className="text-lg font-medium text-foreground">
          {profile?.display_name || user.email}
        </p>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
