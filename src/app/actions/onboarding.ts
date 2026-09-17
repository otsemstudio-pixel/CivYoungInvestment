"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ onboarding_done: true })
    .eq("id", user.id);

  redirect("/patrimoine");
}
