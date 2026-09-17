"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { declareContribution } from "@/app/actions/contributions";
import { SKIP_REASONS, SKIP_REASON_LABELS, type SkipReason } from "@/lib/types";
import { formatFrenchDate, formatXof } from "@/lib/format";
import { Modal } from "@/components/modal";

type Stage = "choice" | "amount" | "skip" | "confirmation";

interface Confirmation {
  streak: number;
  jokerUsedThisPeriod: boolean;
  nextPeriodStartIso: string | null;
}

export function DeclareContributionModal({
  goalId,
  theoreticalAmountXof,
  initialStage = "choice",
  onClose,
}: {
  goalId: string;
  theoreticalAmountXof: number;
  initialStage?: "choice" | "amount" | "skip";
  onClose: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(initialStage);
  const [amount, setAmount] = useState(String(theoreticalAmountXof));
  const [skipReason, setSkipReason] = useState<SkipReason>("imprevu");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitVerse(amount_xof: number) {
    setError(null);
    const formData = new FormData();
    formData.set("kind", "verse");
    formData.set("amount_xof", String(amount_xof));
    startTransition(async () => {
      const result = await declareContribution(goalId, formData);
      if (!result.data) {
        setError(result.error ?? "Erreur inconnue.");
        return;
      }
      router.refresh();
      setConfirmation(result.data);
      setStage("confirmation");
    });
  }

  function submitSkip() {
    setError(null);
    const formData = new FormData();
    formData.set("kind", "saute");
    formData.set("skip_reason", skipReason);
    startTransition(async () => {
      const result = await declareContribution(goalId, formData);
      if (!result.data) {
        setError(result.error ?? "Erreur inconnue.");
        return;
      }
      router.refresh();
      setConfirmation(result.data);
      setStage("confirmation");
    });
  }

  return (
    <Modal onClose={onClose}>
      {error ? (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {stage === "choice" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground/70">Montant proposé pour cette période</p>
          <p className="tabular-nums text-3xl font-semibold text-foreground">
            {formatXof(theoreticalAmountXof)}{" "}
            <span className="text-base font-normal text-foreground/60">FCFA</span>
          </p>

          <button
            type="button"
            disabled={isPending}
            onClick={() => submitVerse(theoreticalAmountXof)}
            className="mt-2 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground disabled:opacity-60"
          >
            J&apos;ai versé ce montant
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStage("amount")}
            className="rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
          >
            Un autre montant
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStage("skip")}
            className="text-sm text-foreground/60"
          >
            Passer cette période
          </button>
        </div>
      ) : null}

      {stage === "amount" ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              Montant versé (FCFA)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent tabular-nums"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage("choice")}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submitVerse(Math.max(0, Math.round(Number(amount) || 0)))}
              className="flex-1 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground disabled:opacity-60"
            >
              Confirmer
            </button>
          </div>
        </div>
      ) : null}

      {stage === "skip" ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Motif</span>
            <select
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value as SkipReason)}
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
            >
              {SKIP_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {SKIP_REASON_LABELS[reason]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage("choice")}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={submitSkip}
              className="flex-1 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground disabled:opacity-60"
            >
              Confirmer
            </button>
          </div>
        </div>
      ) : null}

      {stage === "confirmation" && confirmation ? (
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm text-foreground/70">Série</p>
          <p
            className={`tabular-nums text-4xl font-semibold ${
              confirmation.streak >= 4 ? "text-reward" : "text-foreground"
            }`}
          >
            {confirmation.streak}
          </p>
          {confirmation.jokerUsedThisPeriod ? (
            <p className="rounded-lg bg-reward/10 px-3 py-2 text-sm text-reward">
              Joker utilisé — ta série continue.
            </p>
          ) : null}
          {confirmation.nextPeriodStartIso ? (
            <p className="text-sm text-foreground/70">
              Prochain versement le {formatFrenchDate(confirmation.nextPeriodStartIso)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground"
          >
            Fermer
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
