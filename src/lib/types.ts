export type AssetType =
  | "mobile_money"
  | "compte_bancaire"
  | "sfd"
  | "tontine"
  | "foncier"
  | "stock_marchandise"
  | "creance"
  | "especes"
  | "autre";

export type LiquidityStatus = "disponible" | "immobilise";

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  value_xof: number;
  liquidity: LiquidityStatus;
  created_at: string;
  updated_at: string;
}

export const ASSET_TYPES: AssetType[] = [
  "mobile_money",
  "compte_bancaire",
  "sfd",
  "tontine",
  "foncier",
  "stock_marchandise",
  "creance",
  "especes",
  "autre",
];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  mobile_money: "Mobile money",
  compte_bancaire: "Compte bancaire",
  sfd: "SFD",
  tontine: "Tontine",
  foncier: "Foncier",
  stock_marchandise: "Stock / marchandise",
  creance: "Créance",
  especes: "Espèces",
  autre: "Autre",
};

export const DEFAULT_LIQUIDITY_BY_TYPE: Record<AssetType, LiquidityStatus> = {
  mobile_money: "disponible",
  compte_bancaire: "disponible",
  especes: "disponible",
  sfd: "immobilise",
  tontine: "immobilise",
  foncier: "immobilise",
  stock_marchandise: "immobilise",
  creance: "immobilise",
  autre: "immobilise",
};

export type GoalCadence = "hebdomadaire" | "quinzaine" | "mensuelle";

export type GoalStatus = "actif" | "atteint" | "abandonne";

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_xof: number;
  deadline: string;
  cadence: GoalCadence;
  cadence_anchor: number;
  deposit_location: string;
  status: GoalStatus;
  created_at: string;
}

export const GOAL_CADENCES: GoalCadence[] = [
  "hebdomadaire",
  "quinzaine",
  "mensuelle",
];

export const GOAL_CADENCE_LABELS: Record<GoalCadence, string> = {
  hebdomadaire: "Chaque semaine",
  quinzaine: "Toutes les deux semaines",
  mensuelle: "Chaque mois",
};

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

export const MAX_ACTIVE_GOALS = 2;

export type ContributionKind = "verse" | "saute";

export type SkipReason =
  | "imprevu"
  | "revenu_retard"
  | "objectif_trop_eleve"
  | "autre";

export const SKIP_REASONS: SkipReason[] = [
  "imprevu",
  "revenu_retard",
  "objectif_trop_eleve",
  "autre",
];

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  imprevu: "Imprévu",
  revenu_retard: "Revenu en retard",
  objectif_trop_eleve: "Objectif trop élevé",
  autre: "Autre",
};

export interface Contribution {
  id: string;
  goal_id: string;
  user_id: string;
  period_start: string;
  kind: ContributionKind;
  amount_xof: number;
  skip_reason: SkipReason | null;
  declared_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
