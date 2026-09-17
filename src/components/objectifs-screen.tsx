"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createGoal } from "@/app/actions/goals";
import {
  GOAL_CADENCE_LABELS,
  MAX_ACTIVE_GOALS,
  type Goal,
  type GoalCadence,
} from "@/lib/types";
import type { GoalProgress } from "@/lib/periods";
import { formatFrenchDate, formatXof } from "@/lib/format";
import { GoalForm } from "@/components/goal-form";
import { Modal } from "@/components/modal";
import { DeclareContributionModal } from "@/components/declare-contribution-modal";
import { PushSubscribeBanner } from "@/components/push-subscribe-banner";

type GoalWithProgress = Goal & { progress: GoalProgress; streak: number };

const EMPTY_PROGRESS: GoalProgress = {
  totalVerseXof: 0,
  progressPct: 0,
  currentPeriodStartIso: null,
  theoreticalAmountXof: null,
  currentPeriodContribution: null,
};

function goalFromFormData(formData: FormData, id: string): GoalWithProgress {
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
    progress: EMPTY_PROGRESS,
    streak: 0,
  };
}

export function ObjectifsScreen({
  initialGoals,
}: {
  initialGoals: GoalWithProgress[];
}) {
  const [goals, applyOptimistic] = useOptimistic(
    initialGoals,
    (state: GoalWithProgress[], goal: GoalWithProgress) => [goal, ...state],
  );
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Lu une seule fois, à l'état initial : un lien de notification
  // (?declare=<id>&stage=amount|skip) ouvre directement la bonne modale.
  const [declaringGoalId, setDeclaringGoalId] = useState<string | null>(() =>
    searchParams.get("declare"),
  );
  const [declareStage] = useState<"choice" | "amount" | "skip">(() => {
    const stage = searchParams.get("stage");
    return stage === "amount" || stage === "skip" ? stage : "choice";
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("declare")) router.replace("/objectifs");
    // Nettoyage d'URL ponctuel : ne doit pas se relancer à chaque changement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = goals.length < MAX_ACTIVE_GOALS;
  const declaringGoal = goals.find((g) => g.id === declaringGoalId) ?? null;

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

      {goals.length > 0 ? <PushSubscribeBanner /> : null}

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
        <ul className="flex flex-col gap-3">
          {goals.map((goal) => {
            const alreadyDeclared = goal.progress.currentPeriodContribution !== null;
            return (
              <li
                key={goal.id}
                className="rounded-xl border border-border bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <p className="text-base font-medium text-foreground">{goal.name}</p>
                  {goal.streak > 0 ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
                        goal.streak >= 4
                          ? "bg-reward/10 text-reward"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      Série · {goal.streak}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 tabular-nums text-lg font-semibold text-foreground">
                  {formatXof(goal.progress.totalVerseXof)}{" "}
                  <span className="text-sm font-normal text-foreground/60">
                    / {formatXof(goal.target_xof)} FCFA
                  </span>
                </p>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${goal.progress.progressPct}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-foreground/60">
                  Échéance le {formatFrenchDate(goal.deadline)} ·{" "}
                  {GOAL_CADENCE_LABELS[goal.cadence]}
                </p>
                <p className="text-xs text-foreground/60">
                  Dépôt : {goal.deposit_location}
                </p>

                {alreadyDeclared ? (
                  <p className="mt-3 text-sm text-foreground/60">
                    Cette période est déjà déclarée.
                  </p>
                ) : goal.progress.theoreticalAmountXof !== null ? (
                  <button
                    type="button"
                    onClick={() => setDeclaringGoalId(goal.id)}
                    className="mt-3 w-full rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent"
                  >
                    Déclarer un versement
                  </button>
                ) : goal.progress.currentPeriodStartIso === null ? (
                  <p className="mt-3 text-sm text-foreground/60">
                    La première période commence bientôt.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-foreground/60">
                    L&apos;échéance est dépassée pour ce rythme. Envisage de la
                    déplacer.
                  </p>
                )}
              </li>
            );
          })}
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

      {declaringGoal && declaringGoal.progress.theoreticalAmountXof !== null ? (
        <DeclareContributionModal
          goalId={declaringGoal.id}
          theoreticalAmountXof={declaringGoal.progress.theoreticalAmountXof}
          initialStage={declareStage}
          onClose={() => setDeclaringGoalId(null)}
        />
      ) : null}
    </div>
  );
}
