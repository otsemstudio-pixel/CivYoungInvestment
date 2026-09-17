# Spec MVP — application patrimoine & épargne (Côte d'Ivoire)

Ce document est la source de vérité. Ne rien ajouter qui n'y figure pas.
À placer à la racine du dépôt sous le nom `CLAUDE.md`.

---

## 1. Ce que fait le produit

Une PWA qui permet à un utilisateur ivoirien de :

1. déclarer tout ce qu'il possède — y compris des actifs informels — et voir un total unique ;
2. se fixer des objectifs d'épargne et déclarer ses versements, pour tenir la discipline.

**L'application ne détient jamais d'argent.** Aucun paiement, aucune API bancaire,
aucun identifiant financier demandé. C'est un principe produit, pas une limite
technique : il ne doit jamais être contourné.

Langue de l'interface : français, tutoiement.
Devise unique : franc CFA (XOF). Pas de multi-devise.

---

## 2. Stack imposée

| Élément | Choix |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styles | Tailwind CSS |
| Base de données + Auth | Supabase (Postgres) |
| Hébergement | Vercel |
| Tâches planifiées | Vercel Cron |
| Notifications | Web Push natif (`web-push`, clés VAPID). Aucun service tiers. |

Contraintes de performance, non négociables :

- premier chargement sous 200 Ko ;
- polices système uniquement, aucune webfont ;
- pas de librairie d'animation, pas de librairie d'icônes complète (SVG inline au cas par cas) ;
- écritures optimistes : l'UI se met à jour avant la réponse serveur, la synchro suit.

---

## 3. Modèle de données

Tous les montants sont des **entiers en FCFA**. Jamais de décimales, jamais de flottants.

### `profiles`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `display_name` | text | nullable |
| `onboarding_done` | bool | défaut `false` |
| `created_at` | timestamptz | |

### `assets`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `name` | text | libre, ex. « Tontine du marché » |
| `type` | enum | voir liste ci-dessous |
| `value_xof` | bigint | entier |
| `liquidity` | enum | `disponible` \| `immobilise` |
| `created_at`, `updated_at` | timestamptz | |

`type` ∈ `mobile_money`, `compte_bancaire`, `sfd`, `tontine`, `foncier`,
`stock_marchandise`, `creance`, `especes`, `autre`.

Valeur par défaut de `liquidity` selon le type :
`disponible` pour `mobile_money`, `compte_bancaire`, `especes` ;
`immobilise` pour tous les autres. L'utilisateur peut toujours corriger.

### `goals`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `name` | text | |
| `target_xof` | bigint | |
| `deadline` | date | |
| `cadence` | enum | `hebdomadaire` \| `quinzaine` \| `mensuelle` |
| `cadence_anchor` | int | jour du mois (1–28) ou jour de semaine (1–7) |
| `deposit_location` | text | ex. « Wave secondaire ». **Obligatoire.** |
| `status` | enum | `actif` \| `atteint` \| `abandonne` |
| `created_at` | timestamptz | |

Maximum **2 objectifs `actif`** par utilisateur. Refus côté serveur au-delà.

`deposit_location` ne sert à rien dans le MVP mais conditionne le rapprochement
automatique en phase 2. Ne pas le retirer.

### `contributions`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `goal_id` | uuid FK | |
| `user_id` | uuid FK | |
| `period_start` | date | début de la période visée, unique par `(goal_id, period_start)` |
| `kind` | enum | `verse` \| `saute` |
| `amount_xof` | bigint | `0` si `saute` |
| `skip_reason` | enum | nullable : `imprevu`, `revenu_retard`, `objectif_trop_eleve`, `autre` |
| `declared_at` | timestamptz | |

### `snapshots`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `month` | date | premier jour du mois, unique par `(user_id, month)` |
| `total_xof`, `available_xof`, `immobilized_xof` | bigint | |
| `created_at` | timestamptz | |

### `push_subscriptions`
`id`, `user_id`, `endpoint` (unique), `p256dh`, `auth`, `created_at`.

### Sécurité
RLS activé sur **toutes** les tables. Un utilisateur ne lit et n'écrit que ses
propres lignes. Aucune exception.

---

## 4. Règles métier

À implémenter exactement comme décrit. Ne pas improviser.

### 4.1 Périodes

Chaque objectif génère des périodes successives à partir de `created_at`, selon
`cadence` et `cadence_anchor`. Une période a un `period_start` et se termine la
veille du `period_start` suivant.

### 4.2 Série (`streak`)

Calculée à la volée, jamais stockée en dur.

- La série est le nombre de périodes **consécutives et closes** portant une
  `contribution` de type `verse`, **plus** la période en cours si elle en porte une.
- **Un versement partiel compte.** `amount_xof` inférieur au montant théorique
  n'a aucun effet sur la série. C'est délibéré.
- Une période close sans `contribution`, ou avec une `contribution` de type
  `saute`, **casse la série** — sauf joker (§4.3).
- Montant théorique par période = `(target_xof − déjà versé) / périodes restantes
  jusqu'à deadline`, recalculé à chaque période. Affiché à titre indicatif, jamais
  contraignant.

### 4.3 Joker

- 1 joker disponible par fenêtre glissante de 90 jours et par objectif.
- Consommé automatiquement par la première rupture rencontrée dans le calcul.
- Quand un joker absorbe une rupture, la série **continue** sans incrémenter.
- L'interface ne parle jamais d'« échec ». Message : « Joker utilisé — ta série
  continue. »

### 4.4 Interdits d'interface

- Jamais de rouge sur un objectif en retard ou une série cassée. Le rouge est
  réservé aux erreurs techniques réelles.
- Jamais de point d'exclamation dans les messages de félicitation.
- Ne jamais afficher une projection de réussite qu'on sait fausse. Si le rythme
  actuel ne permet pas d'atteindre la cible avant la `deadline`, le dire et
  proposer de déplacer l'échéance.

### 4.5 Snapshot mensuel

Cron quotidien. Le 1er de chaque mois, pour chaque utilisateur ayant au moins un
actif, écrire une ligne `snapshots` avec les totaux du jour. Idempotent grâce à
la contrainte unique `(user_id, month)`.

**Aucun écran ne consomme cette table dans le MVP.** Elle existe parce que
l'historique est irrattrapable une fois perdu.

### 4.6 Rappels

Cron quotidien. Pour chaque objectif `actif` dont une nouvelle période s'ouvre
aujourd'hui et dont l'utilisateur a une `push_subscription` valide, envoyer une
notification portant trois actions :

- `J'ai versé` → enregistre `verse` avec le montant théorique, **sans ouvrir l'app** ;
- `Autre` → ouvre l'écran de saisie du montant ;
- `Pas ce mois-ci` → ouvre l'écran de motif.

Un endpoint qui renvoie 404 ou 410 est supprimé de la table.

---

## 5. Écrans

Trois onglets en bas : **Patrimoine**, **Objectifs**, **Moi**. Bouton `+` flottant
en bas à droite sur l'onglet Patrimoine. Pas de menu hamburger, jamais.

### Onboarding (après inscription)
4 à 5 écrans, **une question par écran**, qui créent les premiers actifs :
mobile money, compte bancaire ou SFD, tontine, foncier ou marchandise, espèces.
Chaque question est passable. Écran final : le total apparaît.
C'est l'écran le plus important du produit.

### Patrimoine
Bloc supérieur fixe : total en gros, variation du mois en pastille, bouton œil
pour masquer les montants. En dessous, une feuille qui glisse : barre
disponible / immobilisé, puis liste des actifs. Tap sur un actif → modification
ou suppression.

### Objectifs
Liste des objectifs actifs avec progression, série, montant et échéance.
Bouton de création si moins de deux objectifs actifs.

### Déclaration
Trois états : montant théorique proposé, saisie d'un montant différent, motif de
saut. Écran de confirmation affichant la série et la date du prochain versement.

### Moi
Nom, déconnexion, réinstallation de la PWA, lien vers la politique de
confidentialité. Rien d'autre.

### Format des montants
Chiffre en grand, `FCFA` en petit à côté. Séparateur de milliers = espace fine
insécable. `font-variant-numeric: tabular-nums` partout.
Ne jamais tronquer un montant. Au-delà de 9 999 999, abréger en `12,4 M` avec le
détail au tap.

---

## 6. Design

| Rôle | Valeur |
|---|---|
| Fond | clair, crème très légèrement chaud |
| Accent | vert profond, utilisé sur les cartes et les montants positifs, jamais en aplat plein écran |
| Récompense | une seule couleur vive, réservée à la série ≥ 4 périodes et aux paliers atteints |
| Danger | réservé aux erreurs techniques |

Contraste minimum 4,5:1 partout — l'app se lit en plein soleil.
Zone du pouce : toute action primaire dans le tiers inférieur de l'écran.

---

## 7. Hors périmètre — ne pas implémenter

Suivi des dépenses · lecture de SMS ou de notifications · actualités · ebooks ·
formations · abonnement et paiement · import de relevés PDF ou CSV · export ·
multi-devise · graphique d'évolution · fonction sociale ou binôme · partage ·
mode sombre · internationalisation · OTP par SMS · plus de 3 onglets.

Si une de ces fonctionnalités semble utile pendant le développement : ne pas
l'ajouter, la noter.

---

## 8. Ordre de construction

| Jour | Livrable |
|---|---|
| 1 | Projet, schéma complet, RLS, auth email + mot de passe, réinitialisation |
| 2 | CRUD actifs |
| 3 | Écran patrimoine + masquage des montants |
| 4 | Onboarding en questions |
| 5 | Création et liste d'objectifs |
| 6 | Déclaration de versement, progression |
| 7 | Série, joker, écran de confirmation |
| 8 | Cron snapshot, horodatages d'analytics, politique de confidentialité |
| 9 | PWA installable, Web Push, cron de rappels |
| 10 | Déploiement, test sur Android bas de gamme en 3G, correctifs |

Ordre de coupe en cas de retard : Web Push (9), puis joker (7), puis masquage
des montants (3), puis modification d'actif (2).
**Ne jamais couper l'onboarding (4) ni le snapshot (8).**

---

## 9. La seule mesure qui compte

Une requête : *combien d'utilisateurs déclarent encore un versement à la semaine 6.*

Prévoir les horodatages nécessaires. Ne pas construire de tableau de bord.
