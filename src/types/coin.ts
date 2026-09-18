/**
 * NUMISMA data model — design contract (design.md §7).
 * All page agents depend on these exact shapes.
 */

export type CoinStatus = "verified" | "pending" | "draft";

export interface CatalogRef {
  system: string; // "KM", "Y", "RIC", "Schön", "Fr"…
  code: string; // "1289", "II 345"…
}

export interface CoinImages {
  obverse?: string; // path ("/coins/slug-obverse.jpg") or object URL
  reverse?: string;
  edge?: string;
}

export interface CoinSource {
  label: string;
  url: string;
}

export interface Coin {
  id: string;
  accessionNo: number; // Nº 0001…
  title: string; // "France 2 Euro 1999"
  country: string;
  issuer?: string; // issuer for empires/organizations
  denomination: string; // "2 Euro", "1 Dollar"
  currency?: string;
  year?: number;
  era?: string; // era for ancient ("c. 117–138 AD")
  mint?: string;
  mintMark?: string;
  composition?: string; // "Bimetallic: CuNi / Ni-brass"
  weightG?: number;
  diameterMm?: number;
  thicknessMm?: number;
  shape?: string; // round, scalloped, square…
  edge?: string; // reeded, lettered, smooth…
  obverseDesc?: string;
  reverseDesc?: string;
  designer?: string;
  engraver?: string;
  mintage?: number;
  catalogRefs: CatalogRef[];
  grade?: string; // G4…MS70 (Sheldon) or VF, EF…
  confidence?: number; // 0–100 identification confidence
  status: CoinStatus;
  acquiredDate?: string; // ISO date "YYYY-MM-DD"
  acquiredFrom?: string;
  pricePaid?: number;
  estimatedValue?: number;
  storageLocation?: string; // "Album 2, page 14"
  notes?: string;
  tags: string[];
  images: CoinImages;
  sources: CoinSource[];
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/** Fields a caller may supply when creating a coin (rest are defaulted). */
export type NewCoinInput = Partial<Omit<Coin, "id" | "accessionNo" | "createdAt" | "updatedAt">> &
  Pick<Coin, "title" | "country" | "denomination">;
