import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ObjectifsScreen } from "@/components/objectifs-screen";
import { computeGoalProgress, computeStreak } from "@/lib/periods";
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
      const contributions = (contributionsData ?? []) as Contribution[];
      const progress = computeGoalProgress(goal, contributions);
      const streak = computeStreak(goal, contributions);
      return { ...goal, progress, streak: streak.streak };
    }),
  );

  return <ObjectifsScreen initialGoals={goalsWithProgress} />;
}
