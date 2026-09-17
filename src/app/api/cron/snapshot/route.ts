import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron quotidien (§4.5). N'écrit une ligne snapshots que le 1er de
 * chaque mois ; les autres jours répondent 200 sans rien faire, pour
 * qu'un déclenchement quotidien reste un no-op sûr le reste du temps.
 * L'upsert sur (user_id, month) rend l'écriture idempotente si le cron
 * est rejoué le même jour.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  if (today.getUTCDate() !== 1) {
    return NextResponse.json({ ok: true, skipped: "not the 1st of the month" });
  }

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  const supabase = createAdminClient();
  const { data: assets, error } = await supabase
    .from("assets")
    .select("user_id, value_xof, liquidity");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totals = new Map<string, { total: number; available: number }>();
  for (const asset of assets ?? []) {
    const entry = totals.get(asset.user_id) ?? { total: 0, available: 0 };
    entry.total += asset.value_xof;
    if (asset.liquidity === "disponible") entry.available += asset.value_xof;
    totals.set(asset.user_id, entry);
  }

  const rows = Array.from(totals.entries()).map(([user_id, { total, available }]) => ({
    user_id,
    month: monthStart,
    total_xof: total,
    available_xof: available,
    immobilized_xof: total - available,
  }));

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("snapshots")
      .upsert(rows, { onConflict: "user_id,month" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, month: monthStart, usersSnapshotted: rows.length });
}
