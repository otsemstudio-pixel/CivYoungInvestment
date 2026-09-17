"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createGoal } from "@/app/actions/goals";
import {
  GOAL_CADENCE_LABELS,
  MAX_ACTIVE_GOALS,
  type Goal,
  type GoalCadence,
} from "@/lib/types";
import { formatXof } from "@/lib/format";
import { GoalForm } from "@/components/goal-form";
import { Modal } from "@/components/modal";

function formatDeadline(deadline: string) {
  return new Date(`${deadline}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function goalFromFormData(formData: FormData, id: string): Goal {
  return {
    id,
    user_id: "",
    name: String(formData.get("name") ?? ""),
    target_xof: Number(formData.get("target_xof") ?? 0),
    deadline: String(formData.get("deadline") ?? ""),
    cadence: String(formData.get("cadence") ?? "mensuelle") as GoalCadence,
    cadence_anchor: Number(formData.get("cadence_anchor") ?? 1),
    deposit_location: String(formData.get("deposit_location") ?? ""),
    status: "actif",
    created_at: new Date().toISOString(),
  };
}

export function ObjectifsScreen({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, applyOptimistic] = useOptimistic(
    initialGoals,
    (state: Goal[], goal: Goal) => [goal, ...state],
  );
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = goals.length < MAX_ACTIVE_GOALS;

  function handleCreate(formData: FormData) {
    setError(null);
    const optimistic = goalFromFormData(formData, `optimistic-${crypto.randomUUID()}`);
    setCreating(false);
    startTransition(async () => {
      applyOptimistic(optimistic);
      const result = await createGoal(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Objectifs</h1>

      {error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {goals.length === 0 ? (
        <p className="rounded-xl border border-border bg-white px-4 py-6 text-center text-sm text-foreground/60">
          Aucun objectif pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="rounded-xl border border-border bg-white px-4 py-3"
            >
              <p className="text-base font-medium text-foreground">{goal.name}</p>
              <p className="mt-1 tabular-nums text-lg font-semibold text-foreground">
                {formatXof(goal.target_xof)}{" "}
                <span className="text-sm font-normal text-foreground/60">FCFA</span>
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                Échéance le {formatDeadline(goal.deadline)} ·{" "}
                {GOAL_CADENCE_LABELS[goal.cadence]}
              </p>
              <p className="text-xs text-foreground/60">
                Dépôt : {goal.deposit_location}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canCreate ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground"
        >
          + Créer un objectif
        </button>
      ) : (
        <p className="text-center text-sm text-foreground/60">
          Tu as déjà {MAX_ACTIVE_GOALS} objectifs actifs.
        </p>
      )}

      {creating ? (
        <Modal onClose={() => setCreating(false)}>
          <GoalForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            pending={false}
          />
        </Modal>
      ) : null}
    </div>
  );
}
