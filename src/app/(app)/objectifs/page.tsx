import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ObjectifsScreen } from "@/components/objectifs-screen";
import { computeGoalProgress } from "@/lib/periods";
import type { Contribution, Goal } from "@/lib/types";

export default async function ObjectifsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: goalsData } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "actif")
    .order("created_at", { ascending: false });

  const goals = (goalsData ?? []) as Goal[];

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal) => {
      const { data: contributionsData } = await supabase
        .from("contributions")
        .select("*")
        .eq("goal_id", goal.id);
      const progress = computeGoalProgress(
        goal,
        (contributionsData ?? []) as Contribution[],
      );
      return { ...goal, progress };
    }),
  );

  return <ObjectifsScreen initialGoals={goalsWithProgress} />;
}
