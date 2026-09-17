"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ASSET_TYPES,
  DEFAULT_LIQUIDITY_BY_TYPE,
  type Asset,
  type AssetType,
  type LiquidityStatus,
} from "@/lib/types";

type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

type AssetInput = {
  name: string;
  type: AssetType;
  value_xof: number;
  liquidity: LiquidityStatus;
};

function readAssetInput(
  formData: FormData,
): { ok: true; value: AssetInput } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as AssetType;
  const valueRaw = String(formData.get("value_xof") ?? "");
  const liquidityRaw = formData.get("liquidity");

  if (!name) return { ok: false, error: "Le nom est obligatoire." };
  if (!ASSET_TYPES.includes(type)) return { ok: false, error: "Type invalide." };

  const value_xof = Number(valueRaw);
  if (!Number.isFinite(value_xof) || value_xof < 0 || !Number.isInteger(value_xof)) {
    return { ok: false, error: "Le montant doit être un entier positif." };
  }

  const liquidity = (
    liquidityRaw ? String(liquidityRaw) : DEFAULT_LIQUIDITY_BY_TYPE[type]
  ) as LiquidityStatus;
  if (liquidity !== "disponible" && liquidity !== "immobilise") {
    return { ok: false, error: "Liquidité invalide." };
  }

  return { ok: true, value: { name, type, value_xof, liquidity } };
}

export async function createAsset(
  formData: FormData,
): Promise<ActionResult<Asset>> {
  const input = readAssetInput(formData);
  if (!input.ok) return { error: input.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data, error } = await supabase
    .from("assets")
    .insert({
      name: input.value.name,
      type: input.value.type,
      value_xof: input.value.value_xof,
      liquidity: input.value.liquidity,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  return { data: data as Asset };
}

export async function updateAsset(
  id: string,
  formData: FormData,
): Promise<ActionResult<Asset>> {
  const input = readAssetInput(formData);
  if (!input.ok) return { error: input.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .update({
      name: input.value.name,
      type: input.value.type,
      value_xof: input.value.value_xof,
      liquidity: input.value.liquidity,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  return { data: data as Asset };
}

export async function deleteAsset(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { data: { id } };
}
