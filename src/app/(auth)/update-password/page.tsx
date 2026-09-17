import { updatePassword } from "../actions";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        Nouveau mot de passe
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Choisis un nouveau mot de passe pour ton compte.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={updatePassword} className="mt-6 flex flex-col gap-4">
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
          Enregistrer
        </button>
      </form>
    </div>
  );
}
