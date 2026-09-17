"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function originFrom(headers: Headers) {
  return headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=Champs manquants");
  }

  const supabase = await createClient();
  const origin = originFrom(await headers());

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signup?confirm=1");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Champs manquants");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Identifiants incorrects")}`);
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/reset-password?error=Champ manquant");
  }

  const supabase = await createClient();
  const origin = originFrom(await headers());

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  // Toujours confirmer, même si l'adresse n'existe pas : ne pas
  // révéler quels emails sont inscrits.
  redirect("/reset-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!password || password.length < 8) {
    redirect(
      `/update-password?error=${encodeURIComponent("8 caractères minimum")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
