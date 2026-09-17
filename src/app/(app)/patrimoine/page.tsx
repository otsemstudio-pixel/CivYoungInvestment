import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatrimoineScreen } from "@/components/patrimoine-screen";
import type { Asset } from "@/lib/types";

export default async function PatrimoinePage() {
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

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  const { data: snapshot } = await supabase
    .from("snapshots")
    .select("total_xof")
    .eq("user_id", user.id)
    .eq("month", monthStart)
    .maybeSingle();

  return (
    <PatrimoineScreen
      initialAssets={(assets ?? []) as Asset[]}
      monthStartTotal={snapshot?.total_xof ?? null}
    />
  );
}
