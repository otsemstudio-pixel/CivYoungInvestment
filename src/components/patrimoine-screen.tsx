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
import { MASKED_AMOUNT, formatXof } from "@/lib/format";
import { useHiddenAmounts } from "@/lib/hooks/use-hidden-amounts";
import { AssetForm } from "@/components/asset-form";
import { Modal } from "@/components/modal";

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

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

export function PatrimoineScreen({
  initialAssets,
  monthStartTotal,
}: {
  initialAssets: Asset[];
  monthStartTotal: number | null;
}) {
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
  const { hidden, toggle } = useHiddenAmounts();
  const [creating, setCreating] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = assets.reduce((sum, a) => sum + a.value_xof, 0);
  const available = assets
    .filter((a) => a.liquidity === "disponible")
    .reduce((sum, a) => sum + a.value_xof, 0);
  const immobilized = total - available;
  const variation = monthStartTotal === null ? null : total - monthStartTotal;

  function display(value: number) {
    return hidden ? MASKED_AMOUNT : formatXof(value);
  }

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
    setEditingAsset(null);
    startTransition(async () => {
      applyOptimistic({ kind: "update", asset: optimistic });
      const result = await updateAsset(asset.id, formData);
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setSelectedAsset(null);
    startTransition(async () => {
      applyOptimistic({ kind: "remove", id });
      const result = await deleteAsset(id);
      if (result.error) setError(result.error);
    });
  }

  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <div className="relative">
      <div
        className="sticky top-0 z-10 bg-background px-4 pb-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <div className="mx-auto flex max-w-md items-start justify-between">
          <div>
            <p className="text-sm text-foreground/60">Patrimoine total</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">
              {display(total)}{" "}
              <span className="text-lg font-normal text-foreground/60">FCFA</span>
            </p>
            {variation !== null ? (
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
                  variation >= 0
                    ? "bg-accent/10 text-accent"
                    : "bg-foreground/10 text-foreground/70"
                }`}
              >
                {variation >= 0 ? "+" : "-"}
                {display(Math.abs(variation))} FCFA ce mois-ci
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={hidden ? "Afficher les montants" : "Masquer les montants"}
            className="rounded-full p-2 text-foreground/60"
          >
            <EyeIcon hidden={hidden} />
          </button>
        </div>
      </div>

      {error ? (
        <p className="mx-auto mb-3 max-w-md rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mx-auto max-w-md rounded-t-3xl bg-white px-4 pt-5 pb-8 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <div className="flex h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-accent"
              style={{ width: `${availablePct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-foreground/70">
            <span>
              Disponible · <span className="tabular-nums">{display(available)}</span>
            </span>
            <span>
              Immobilisé · <span className="tabular-nums">{display(immobilized)}</span>
            </span>
          </div>
        </div>

        {assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">
            Aucun actif déclaré pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(asset)}
                  className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left"
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
                  <p className="tabular-nums text-base font-medium text-foreground">
                    {display(asset.value_xof)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCreating(true)}
        aria-label="Ajouter un actif"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-accent-foreground shadow-lg"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        +
      </button>

      {creating ? (
        <Modal onClose={() => setCreating(false)}>
          <AssetForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            pending={false}
          />
        </Modal>
      ) : null}

      {selectedAsset ? (
        <Modal onClose={() => setSelectedAsset(null)}>
          <p className="mb-3 text-base font-medium text-foreground">
            {selectedAsset.name}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingAsset(selectedAsset);
                setSelectedAsset(null);
              }}
              className="rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedAsset.id)}
              className="rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground/70"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      ) : null}

      {editingAsset ? (
        <Modal onClose={() => setEditingAsset(null)}>
          <AssetForm
            asset={editingAsset}
            onSubmit={(formData) => handleUpdate(editingAsset, formData)}
            onCancel={() => setEditingAsset(null)}
            pending={false}
          />
        </Modal>
      ) : null}
    </div>
  );
}
