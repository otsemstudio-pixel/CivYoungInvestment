import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./(auth)/actions";
import { AssetsScreen } from "@/components/assets-screen";
import type { Asset } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <AssetsScreen initialAssets={(assets ?? []) as Asset[]} />
      <form action={logout} className="mx-auto pb-8">
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
