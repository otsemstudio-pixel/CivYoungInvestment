import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ObjectifsScreen } from "@/components/objectifs-screen";
import type { Goal } from "@/lib/types";

export default async function ObjectifsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "actif")
    .order("created_at", { ascending: false });

  return <ObjectifsScreen initialGoals={(goals ?? []) as Goal[]} />;
}
