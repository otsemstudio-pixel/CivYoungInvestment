import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  if (sent) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Vérifie ta boîte mail
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Si un compte existe avec cette adresse, un lien de réinitialisation
          vient d&apos;être envoyé.
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
      <h1 className="text-2xl font-semibold text-foreground">
        Mot de passe oublié
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Indique ton email, on t&apos;envoie un lien pour le réinitialiser.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={requestPasswordReset} className="mt-6 flex flex-col gap-4">
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

        <button
          type="submit"
          className="mt-2 rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-foreground"
        >
          Envoyer le lien
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/70">
        <Link href="/login" className="text-accent underline-offset-2 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
