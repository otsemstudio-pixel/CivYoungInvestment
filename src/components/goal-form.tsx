"use client";

import { useState } from "react";
import {
  GOAL_CADENCES,
  GOAL_CADENCE_LABELS,
  WEEKDAY_LABELS,
  type GoalCadence,
} from "@/lib/types";

export function GoalForm({
  onSubmit,
  onCancel,
  pending,
}: {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [cadence, setCadence] = useState<GoalCadence>("mensuelle");

  return (
    <form
      action={(formData) => onSubmit(formData)}
      className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-white p-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Nom</span>
        <input
          type="text"
          name="name"
          required
          placeholder="Voyage à Grand-Bassam"
          className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          Montant cible (FCFA)
        </span>
        <input
          type="number"
          name="target_xof"
          required
          min={1}
          step={1}
          className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent tabular-nums"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Échéance</span>
        <input
          type="date"
          name="deadline"
          required
          className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Cadence</span>
        <select
          name="cadence"
          value={cadence}
          onChange={(e) => setCadence(e.target.value as GoalCadence)}
          className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        >
          {GOAL_CADENCES.map((c) => (
            <option key={c} value={c}>
              {GOAL_CADENCE_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      {cadence === "mensuelle" ? (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Jour du mois
          </span>
          <input
            type="number"
            name="cadence_anchor"
            required
            min={1}
            max={28}
            defaultValue={5}
            className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Jour de la semaine
          </span>
          <select
            name="cadence_anchor"
            defaultValue={1}
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          >
            {Object.entries(WEEKDAY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          Lieu de dépôt
        </span>
        <input
          type="text"
          name="deposit_location"
          required
          placeholder="ex. Wave secondaire"
          className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        />
      </label>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground disabled:opacity-60"
        >
          Créer
        </button>
      </div>
    </form>
  );
}
