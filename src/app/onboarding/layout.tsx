import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_done")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_done) {
    redirect("/patrimoine");
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">{children}</div>
    </div>
  );
}
