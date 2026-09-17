import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { declareContribution } from "@/app/actions/contributions";
import { computeGoalProgress } from "@/lib/periods";
import type { Contribution, Goal } from "@/lib/types";

/**
 * Action rapide "J'ai versé" déclenchée depuis la notification (§4.6) :
 * enregistre le montant théorique sans ouvrir l'application. Authentifié
 * par les cookies de session, envoyés automatiquement par le fetch du
 * service worker (même origine).
 */
export async function POST(request: Request) {
  const { goalId } = (await request.json()) as { goalId?: string };
  if (!goalId) {
    return NextResponse.json({ error: "goalId manquant" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();
  if (goalError || !goal) {
    return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
  }

  const { data: contributionsData } = await supabase
    .from("contributions")
    .select("*")
    .eq("goal_id", goalId);

  const progress = computeGoalProgress(
    goal as Goal,
    (contributionsData ?? []) as Contribution[],
  );
  if (progress.theoreticalAmountXof === null) {
    return NextResponse.json({ error: "Pas de période en cours" }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("kind", "verse");
  formData.set("amount_xof", String(progress.theoreticalAmountXof));

  const result = await declareContribution(goalId, formData);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
