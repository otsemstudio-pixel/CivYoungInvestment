"use client";

import { useState } from "react";
import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  DEFAULT_LIQUIDITY_BY_TYPE,
  type Asset,
  type AssetType,
  type LiquidityStatus,
} from "@/lib/types";

export function AssetForm({
  asset,
  onSubmit,
  onCancel,
  pending,
}: {
  asset?: Asset;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [type, setType] = useState<AssetType>(asset?.type ?? "mobile_money");
  const [liquidity, setLiquidity] = useState<LiquidityStatus>(
    asset?.liquidity ?? DEFAULT_LIQUIDITY_BY_TYPE[type],
  );

  return (
    <form
      action={(formData) => onSubmit(formData)}
      className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Nom</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={asset?.name}
          placeholder="Tontine du marché"
          className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => {
            const nextType = e.target.value as AssetType;
            setType(nextType);
            setLiquidity(DEFAULT_LIQUIDITY_BY_TYPE[nextType]);
          }}
          className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
        >
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {ASSET_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          Valeur (FCFA)
        </span>
        <input
          type="number"
          name="value_xof"
          required
          min={0}
          step={1}
          defaultValue={asset?.value_xof}
          className="rounded-lg border border-border px-3 py-2.5 text-base text-foreground outline-none focus:border-accent tabular-nums"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Liquidité
        </legend>
        <div className="flex gap-2">
          {(["disponible", "immobilise"] as const).map((option) => (
            <label
              key={option}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm ${
                liquidity === option
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground/70"
              }`}
            >
              <input
                type="radio"
                name="liquidity"
                value={option}
                checked={liquidity === option}
                onChange={() => setLiquidity(option)}
                className="sr-only"
              />
              {option === "disponible" ? "Disponible" : "Immobilisé"}
            </label>
          ))}
        </div>
      </fieldset>

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
          {asset ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}
