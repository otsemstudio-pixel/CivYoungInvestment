"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GOAL_CADENCES, type Goal, type GoalCadence } from "@/lib/types";

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

type GoalInput = {
  name: string;
  target_xof: number;
  deadline: string;
  cadence: GoalCadence;
  cadence_anchor: number;
  deposit_location: string;
};

function readGoalInput(
  formData: FormData,
): { ok: true; value: GoalInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const cadence = String(formData.get("cadence") ?? "") as GoalCadence;
  const deadline = String(formData.get("deadline") ?? "");
  const deposit_location = String(formData.get("deposit_location") ?? "").trim();
  const targetRaw = String(formData.get("target_xof") ?? "");
  const anchorRaw = String(formData.get("cadence_anchor") ?? "");

  if (!name) return { ok: false, error: "Le nom est obligatoire." };
  if (!GOAL_CADENCES.includes(cadence)) {
    return { ok: false, error: "Cadence invalide." };
  }
  if (!deposit_location) {
    return { ok: false, error: "Le lieu de dépôt est obligatoire." };
  }

  const target_xof = Number(targetRaw);
  if (!Number.isFinite(target_xof) || target_xof <= 0 || !Number.isInteger(target_xof)) {
    return { ok: false, error: "Le montant cible doit être un entier positif." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return { ok: false, error: "Échéance invalide." };
  }
  if (new Date(deadline) <= new Date(new Date().toDateString())) {
    return { ok: false, error: "L'échéance doit être dans le futur." };
  }

  const cadence_anchor = Number(anchorRaw);
  const maxAnchor = cadence === "mensuelle" ? 28 : 7;
  if (
    !Number.isInteger(cadence_anchor) ||
    cadence_anchor < 1 ||
    cadence_anchor > maxAnchor
  ) {
    return { ok: false, error: "Jour invalide pour cette cadence." };
  }

  return {
    ok: true,
    value: { name, target_xof, deadline, cadence, cadence_anchor, deposit_location },
  };
}

export async function createGoal(formData: FormData): Promise<ActionResult<Goal>> {
  const input = readGoalInput(formData);
  if (!input.ok) return { error: input.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data, error } = await supabase
    .from("goals")
    .insert({ ...input.value, status: "actif" })
    .select()
    .single();

  if (error) {
    if (error.message.includes("max_active_goals_reached")) {
      return {
        error:
          "Tu as déjà deux objectifs actifs. Termine ou abandonne l'un d'eux avant d'en créer un nouveau.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/objectifs");
  return { data: data as Goal };
}
