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
