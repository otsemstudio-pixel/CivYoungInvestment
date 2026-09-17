import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeGoalProgress, currentPeriodStart, toDateOnly, toIsoDate } from "@/lib/periods";
import { sendReminderPush } from "@/lib/push";
import { formatXof } from "@/lib/format";
import type { Contribution, Goal, PushSubscriptionRecord } from "@/lib/types";

/**
 * Cron quotidien (§4.6). Pour chaque objectif actif dont une nouvelle
 * période s'ouvre aujourd'hui, notifie les abonnements push valides de
 * son utilisateur. Un endpoint qui échoue en 404/410 est supprimé.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = toDateOnly(toIsoDate(new Date()));

  const { data: goalsData, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "actif");
  if (goalsError) {
    return NextResponse.json({ error: goalsError.message }, { status: 500 });
  }

  let notified = 0;
  let removedSubscriptions = 0;

  for (const goal of (goalsData ?? []) as Goal[]) {
    const createdAt = toDateOnly(toIsoDate(new Date(goal.created_at)));
    const current = currentPeriodStart(createdAt, goal.cadence, goal.cadence_anchor, today);
    if (!current || toIsoDate(current) !== toIsoDate(today)) continue;

    const { data: contributionsData } = await supabase
      .from("contributions")
      .select("*")
      .eq("goal_id", goal.id);
    const progress = computeGoalProgress(
      goal,
      (contributionsData ?? []) as Contribution[],
      today,
    );
    if (progress.theoreticalAmountXof === null) continue;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", goal.user_id);

    for (const subscription of (subscriptions ?? []) as PushSubscriptionRecord[]) {
      const result = await sendReminderPush(subscription, {
        title: goal.name,
        body: `Montant proposé : ${formatXof(progress.theoreticalAmountXof)} FCFA`,
        goalId: goal.id,
      });
      if (result.ok) {
        notified++;
      } else if (result.expired) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        removedSubscriptions++;
      }
    }
  }

  return NextResponse.json({ ok: true, notified, removedSubscriptions });
}
