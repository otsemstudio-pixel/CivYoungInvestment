"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeStreak, currentPeriodStart, toDateOnly, toIsoDate } from "@/lib/periods";
import { SKIP_REASONS, type Contribution, type Goal, type SkipReason } from "@/lib/types";

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

export interface DeclareContributionResult {
  period_start: string;
  streak: number;
  jokerUsedThisPeriod: boolean;
  nextPeriodStartIso: string | null;
}

export async function declareContribution(
  goalId: string,
  formData: FormData,
): Promise<ActionResult<DeclareContributionResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();
  if (goalError || !goal) return { error: "Objectif introuvable." };

  const typedGoal = goal as Goal;
  const createdAt = toDateOnly(toIsoDate(new Date(typedGoal.created_at)));
  const today = toDateOnly(toIsoDate(new Date()));
  const periodStart = currentPeriodStart(
    createdAt,
    typedGoal.cadence,
    typedGoal.cadence_anchor,
    today,
  );
  if (!periodStart) {
    return { error: "La première période de cet objectif n'a pas encore commencé." };
  }
  const periodStartIso = toIsoDate(periodStart);

  const kind = String(formData.get("kind") ?? "verse");

  if (kind === "saute") {
    const skipReason = String(formData.get("skip_reason") ?? "") as SkipReason;
    if (!SKIP_REASONS.includes(skipReason)) {
      return { error: "Motif invalide." };
    }
    const { error } = await supabase.from("contributions").upsert(
      {
        goal_id: goalId,
        period_start: periodStartIso,
        kind: "saute",
        amount_xof: 0,
        skip_reason: skipReason,
      },
      { onConflict: "goal_id,period_start" },
    );
    if (error) return { error: error.message };
  } else {
    const amountRaw = String(formData.get("amount_xof") ?? "");
    const amount_xof = Number(amountRaw);
    if (!Number.isFinite(amount_xof) || amount_xof < 0 || !Number.isInteger(amount_xof)) {
      return { error: "Montant invalide." };
    }
    const { error } = await supabase.from("contributions").upsert(
      {
        goal_id: goalId,
        period_start: periodStartIso,
        kind: "verse",
        amount_xof,
        skip_reason: null,
      },
      { onConflict: "goal_id,period_start" },
    );
    if (error) return { error: error.message };
  }

  const { data: allContributions } = await supabase
    .from("contributions")
    .select("*")
    .eq("goal_id", goalId);

  const streakInfo = computeStreak(
    typedGoal,
    (allContributions ?? []) as Contribution[],
    today,
  );

  revalidatePath("/objectifs");
  return {
    data: {
      period_start: periodStartIso,
      streak: streakInfo.streak,
      jokerUsedThisPeriod: streakInfo.jokerUsedAtIso === periodStartIso,
      nextPeriodStartIso: streakInfo.nextPeriodStartIso,
    },
  };
}
