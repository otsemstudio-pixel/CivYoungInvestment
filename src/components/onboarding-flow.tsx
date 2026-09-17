"use client";

import { useState, useTransition } from "react";
import { createAsset } from "@/app/actions/assets";
import { completeOnboarding } from "@/app/actions/onboarding";
import { DEFAULT_LIQUIDITY_BY_TYPE, type AssetType } from "@/lib/types";
import { formatXof } from "@/lib/format";

type Step = {
  key: string;
  question: string;
  hint?: string;
  options: { value: AssetType; label: string }[];
};

const STEPS: Step[] = [
  {
    key: "mobile_money",
    question: "As-tu de l'argent sur Mobile Money ?",
    hint: "Orange Money, MTN Money, Moov Money, Wave…",
    options: [{ value: "mobile_money", label: "Mobile money" }],
  },
  {
    key: "banque_sfd",
    question: "As-tu un compte en banque ou dans une SFD ?",
    options: [
      { value: "compte_bancaire", label: "Banque" },
      { value: "sfd", label: "SFD" },
    ],
  },
  {
    key: "tontine",
    question: "Fais-tu partie d'une tontine ?",
    options: [{ value: "tontine", label: "Tontine" }],
  },
  {
    key: "foncier_stock",
    question: "As-tu un terrain, une parcelle, ou du stock de marchandise ?",
    options: [
      { value: "foncier", label: "Foncier" },
      { value: "stock_marchandise", label: "Stock / marchandise" },
    ],
  },
  {
    key: "especes",
    question: "As-tu de l'argent en espèces ?",
    hint: "À la maison, sur toi…",
    options: [{ value: "especes", label: "Espèces" }],
  },
];

export function OnboardingFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedType, setSelectedType] = useState<AssetType>(
    STEPS[0].options[0].value,
  );
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const done = stepIndex >= STEPS.length;
  const step = STEPS[stepIndex];

  function goToStep(index: number) {
    setStepIndex(index);
    setAmount("");
    setError(null);
    if (index < STEPS.length) {
      setSelectedType(STEPS[index].options[0].value);
    }
  }

  function handleSkip() {
    goToStep(stepIndex + 1);
  }

  function handleNext() {
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) {
      handleSkip();
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set(
      "name",
      step.options.find((o) => o.value === selectedType)?.label ?? step.key,
    );
    formData.set("type", selectedType);
    formData.set("value_xof", String(Math.round(value)));
    formData.set("liquidity", DEFAULT_LIQUIDITY_BY_TYPE[selectedType]);

    startTransition(async () => {
      const result = await createAsset(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTotal((t) => t + Math.round(value));
      goToStep(stepIndex + 1);
    });
  }

  function handleFinish() {
    startTransition(async () => {
      await completeOnboarding();
    });
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-sm text-foreground/60">Ton patrimoine déclaré</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums text-foreground">
          {formatXof(total)}{" "}
          <span className="text-lg font-normal text-foreground/60">FCFA</span>
        </p>
        <p className="mt-4 text-sm text-foreground/70">
          Tu pourras ajouter ou corriger des actifs à tout moment.
        </p>
        <button
          type="button"
          onClick={handleFinish}
          disabled={isPending}
          className="mt-8 w-full rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          C&apos;est parti
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-foreground/50">
        Question {stepIndex + 1} sur {STEPS.length}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">
        {step.question}
      </h1>
      {step.hint ? (
        <p className="mt-1 text-sm text-foreground/60">{step.hint}</p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {step.options.length > 1 ? (
          <div className="flex gap-2">
            {step.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm ${
                  selectedType === option.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-foreground/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Valeur (FCFA)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent tabular-nums"
          />
        </label>

        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          Continuer
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-foreground/60"
        >
          Passer cette question
        </button>
      </div>
    </div>
  );
}
