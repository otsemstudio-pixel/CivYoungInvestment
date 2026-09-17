"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { declareContribution } from "@/app/actions/contributions";
import { SKIP_REASONS, SKIP_REASON_LABELS, type SkipReason } from "@/lib/types";
import { formatXof } from "@/lib/format";
import { Modal } from "@/components/modal";

type Stage = "choice" | "amount" | "skip";

export function DeclareContributionModal({
  goalId,
  theoreticalAmountXof,
  onClose,
}: {
  goalId: string;
  theoreticalAmountXof: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("choice");
  const [amount, setAmount] = useState(String(theoreticalAmountXof));
  const [skipReason, setSkipReason] = useState<SkipReason>("imprevu");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitVerse(amount_xof: number) {
    setError(null);
    const formData = new FormData();
    formData.set("kind", "verse");
    formData.set("amount_xof", String(amount_xof));
    startTransition(async () => {
      const result = await declareContribution(goalId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function submitSkip() {
    setError(null);
    const formData = new FormData();
    formData.set("kind", "saute");
    formData.set("skip_reason", skipReason);
    startTransition(async () => {
      const result = await declareContribution(goalId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
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
    </Modal>
  );
}
