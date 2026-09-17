import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-8 text-sm text-foreground/90">
      <h1 className="text-2xl font-semibold text-foreground">
        Politique de confidentialité
      </h1>
      <p className="text-xs text-foreground/60">Dernière mise à jour : septembre 2026</p>

      <p>
        Cette application t&apos;aide à déclarer ton patrimoine et à suivre tes
        objectifs d&apos;épargne. Elle ne détient jamais d&apos;argent, ne se
        connecte à aucun compte bancaire ou mobile money, et ne demande
        aucun identifiant financier.
      </p>

      <h2 className="mt-2 text-base font-medium text-foreground">
        Données que nous collectons
      </h2>
      <ul className="list-disc pl-5">
        <li>Ton email et ton mot de passe (haché, jamais stocké en clair), pour ton compte.</li>
        <li>Le nom que tu choisis d&apos;afficher, si tu en renseignes un.</li>
        <li>Les actifs que tu déclares : nom, type, valeur, et s&apos;ils sont disponibles ou immobilisés.</li>
        <li>Tes objectifs d&apos;épargne : nom, montant cible, échéance, rythme, et le lieu de dépôt que tu indiques.</li>
        <li>Tes déclarations de versement : montant, date, ou motif si tu passes une période.</li>
        <li>Si tu actives les notifications, les informations techniques nécessaires pour te les envoyer.</li>
      </ul>

      <h2 className="mt-2 text-base font-medium text-foreground">
        Ce que nous ne faisons pas
      </h2>
      <ul className="list-disc pl-5">
        <li>Nous ne lisons ni tes SMS ni tes notifications.</li>
        <li>Nous ne vendons aucune donnée à des tiers.</li>
        <li>Nous n&apos;affichons aucune publicité.</li>
        <li>Nous ne partageons tes données avec personne d&apos;autre que toi.</li>
      </ul>

      <h2 className="mt-2 text-base font-medium text-foreground">Hébergement</h2>
      <p>
        Tes données sont stockées chez Supabase (base de données et
        authentification) ; l&apos;application elle-même est hébergée chez
        Vercel. Chaque utilisateur ne peut lire ou modifier que ses propres
        données : c&apos;est appliqué directement au niveau de la base, pas
        seulement dans l&apos;interface.
      </p>

      <h2 className="mt-2 text-base font-medium text-foreground">Cookies</h2>
      <p>
        Nous utilisons uniquement des cookies techniques nécessaires à ta
        connexion. Aucun cookie publicitaire ou de suivi tiers.
      </p>

      <h2 className="mt-2 text-base font-medium text-foreground">
        Conservation et suppression
      </h2>
      <p>
        Tes données sont conservées tant que ton compte existe. Tu peux
        demander leur suppression à tout moment en nous écrivant à
        l&apos;adresse ci-dessous.
      </p>

      <h2 className="mt-2 text-base font-medium text-foreground">Contact</h2>
      <p>
        Pour toute question ou demande concernant tes données :{" "}
        <a href="mailto:otsemstudio@gmail.com" className="text-accent underline-offset-2 hover:underline">
          otsemstudio@gmail.com
        </a>
      </p>

      <Link href="/moi" className="mt-4 text-sm text-accent underline-offset-2 hover:underline">
        Retour
      </Link>
    </div>
  );
}
