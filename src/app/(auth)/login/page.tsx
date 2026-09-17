import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Connexion</h1>
      <p className="mt-1 text-sm text-foreground/70">
        Retrouve ton patrimoine et tes objectifs.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={login} className="mt-6 flex flex-col gap-4">
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
            autoComplete="current-password"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground outline-none focus:border-accent"
          />
        </label>

        <Link
          href="/reset-password"
          className="self-end text-sm text-accent underline-offset-2 hover:underline"
        >
          Mot de passe oublié ?
        </Link>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/70">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-accent underline-offset-2 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
