import Link from "next/link";
import { signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string }>;
}) {
  const { error, confirm } = await searchParams;

  if (confirm) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Vérifie ta boîte mail
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Un lien de confirmation vient de t&apos;être envoyé. Clique dessus
          pour activer ton compte.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent underline-offset-2 hover:underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Créer un compte</h1>
      <p className="mt-1 text-sm text-foreground/70">
        Pour déclarer ton patrimoine et suivre tes objectifs.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={signup} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            Mot de passe
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          />
          <span className="text-xs text-foreground/60">8 caractères minimum</span>
        </label>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground"
        >
          Créer mon compte
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/70">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-accent underline-offset-2 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
