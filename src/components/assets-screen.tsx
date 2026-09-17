"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createAsset, deleteAsset, updateAsset } from "@/app/actions/assets";
import {
  ASSET_TYPE_LABELS,
  DEFAULT_LIQUIDITY_BY_TYPE,
  type Asset,
  type AssetType,
  type LiquidityStatus,
} from "@/lib/types";
import { formatXof } from "@/lib/format";
import { AssetForm } from "@/components/asset-form";

type OptimisticAction =
  | { kind: "add"; asset: Asset }
  | { kind: "update"; asset: Asset }
  | { kind: "remove"; id: string };

function assetFromFormData(formData: FormData, id: string): Asset {
  const type = String(formData.get("type") ?? "autre") as AssetType;
  const liquidity = (formData.get("liquidity")
    ? String(formData.get("liquidity"))
    : DEFAULT_LIQUIDITY_BY_TYPE[type]) as LiquidityStatus;

  return {
    id,
    user_id: "",
    name: String(formData.get("name") ?? ""),
    type,
    value_xof: Number(formData.get("value_xof") ?? 0),
    liquidity,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function AssetsScreen({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, applyOptimistic] = useOptimistic(
    initialAssets,
    (state: Asset[], action: OptimisticAction) => {
      switch (action.kind) {
        case "add":
          return [action.asset, ...state];
        case "update":
          return state.map((a) => (a.id === action.asset.id ? action.asset : a));
        case "remove":
          return state.filter((a) => a.id !== action.id);
      }
    },
  );
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = assets.reduce((sum, a) => sum + a.value_xof, 0);

  function handleCreate(formData: FormData) {
    setError(null);
    const optimistic = assetFromFormData(formData, `optimistic-${crypto.randomUUID()}`);
    setCreating(false);
    startTransition(async () => {
      applyOptimistic({ kind: "add", asset: optimistic });
      const result = await createAsset(formData);
      if (result.error) setError(result.error);
    });
  }

  function handleUpdate(asset: Asset, formData: FormData) {
    setError(null);
    const optimistic = assetFromFormData(formData, asset.id);
    setEditingId(null);
    startTransition(async () => {
      applyOptimistic({ kind: "update", asset: optimistic });
      const result = await updateAsset(asset.id, formData);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      applyOptimistic({ kind: "remove", id });
      const result = await deleteAsset(id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8">
      <div>
        <p className="text-sm text-foreground/70">Total</p>
        <p className="text-3xl font-semibold tabular-nums text-foreground">
          {formatXof(total)}{" "}
          <span className="text-base font-normal text-foreground/60">FCFA</span>
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground"
        >
          + Ajouter un actif
        </button>
      ) : (
        <AssetForm
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
          pending={false}
        />
      )}

      <ul className="flex flex-col gap-2">
        {assets.map((asset) =>
          editingId === asset.id ? (
            <li key={asset.id}>
              <AssetForm
                asset={asset}
                onSubmit={(formData) => handleUpdate(asset, formData)}
                onCancel={() => setEditingId(null)}
                pending={false}
              />
            </li>
          ) : (
            <li
              key={asset.id}
              className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3"
            >
              <div>
                <p className="text-base font-medium text-foreground">
                  {asset.name}
                </p>
                <p className="text-xs text-foreground/60">
                  {ASSET_TYPE_LABELS[asset.type]} ·{" "}
                  {asset.liquidity === "disponible" ? "Disponible" : "Immobilisé"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="tabular-nums text-base font-medium text-foreground">
                  {formatXof(asset.value_xof)}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingId(asset.id)}
                  className="text-sm text-accent"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(asset.id)}
                  className="text-sm text-foreground/60"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
