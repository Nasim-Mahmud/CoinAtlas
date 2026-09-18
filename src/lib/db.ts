import Dexie, { type Table } from "dexie";
import type { Coin } from "@/types/coin";

/**
 * NUMISMA IndexedDB layer (design.md §7).
 * Database: `numisma`, table `coins` — primary key `id`,
 * indexes on accessionNo, country, year, status, *tags.
 */
export class NumismaDB extends Dexie {
  coins!: Table<Coin, string>;

  constructor() {
    super("numisma");
    this.version(1).stores({
      coins: "id, accessionNo, country, year, status, *tags",
    });
  }
}

export const db = new NumismaDB();

const SEED_FLAG = "numisma:seeded";
const DAY = 24 * 60 * 60 * 1000;

function seedCoin(partial: Omit<Coin, "createdAt" | "updatedAt">, ageDays: number): Coin {
  const created = Date.now() - ageDays * DAY;
  return { ...partial, createdAt: created, updatedAt: created };
}

/** The 12 demo coins (design.md §7 demo seed). Realistic catalogue data. */
export function buildSeedCoins(): Coin[] {
  return [
    seedCoin(
      {
        id: "seed-france-2-euro-1999",
        accessionNo: 1,
        title: "France 2 Euro 1999",
        country: "France",
        denomination: "2 Euro",
        currency: "EUR",
        year: 1999,
        mint: "Paris",
        composition: "Bimetallic: CuNi centre / Ni-brass ring",
        weightG: 8.5,
        diameterMm: 25.75,
        thicknessMm: 2.2,
        shape: "round",
        edge: "Reeded with lettering “2 **” repeated",
        obverseDesc:
          "A stylised tree within a hexagon, symbolising life and growth, flanked by the motto “LIBERTÉ ÉGALITÉ FRATERNITÉ”; “RF” above, twelve stars around the rim.",
        reverseDesc:
          "Luc Luycx's common European reverse: the denomination over a map of the EU before enlargement, twelve stars on the outer ring.",
        designer: "Joaquin Jimenez (national side), Luc Luycx (common side)",
        mintage: 57496000,
        catalogRefs: [
          { system: "KM", code: "1289" },
          { system: "Gadoury", code: "23" },
        ],
        grade: "VF",
        status: "verified",
        acquiredDate: "2019-06-14",
        acquiredFrom: "Circulation find",
        pricePaid: 2,
        estimatedValue: 3,
        storageLocation: "Tray 2, slot 14",
        notes:
          "Found in circulation in Lyon, 2019. First year of issue — honest wear but full legends; kept as the collection's first circulation find.",
        tags: ["euro", "bimetallic"],
        images: {
          obverse: "/coins/france-2-euro-1999-obverse.jpg",
          reverse: "/coins/france-2-euro-1999-reverse.jpg",
        },
        sources: [{ label: "Numista — France 2 Euro 1999", url: "https://en.numista.com/catalogue/pieces1298.html" }],
      },
      320,
    ),
    seedCoin(
      {
        id: "seed-usa-morgan-dollar-1881",
        accessionNo: 2,
        title: "United States Morgan Dollar 1881-S",
        country: "United States",
        denomination: "1 Dollar",
        currency: "USD",
        year: 1881,
        mint: "San Francisco",
        mintMark: "S",
        composition: "Silver .900 / copper .100",
        weightG: 26.73,
        diameterMm: 38.1,
        thicknessMm: 2.4,
        shape: "round",
        edge: "Reeded",
        obverseDesc:
          "Liberty head left wearing a Phrygian cap inscribed LIBERTY, with wheat and cotton in her hair; E PLURIBUS UNUM above, thirteen stars and the date around.",
        reverseDesc:
          "Heraldic eagle with outstretched wings clutching arrows and an olive branch, within a laurel wreath; UNITED STATES OF AMERICA · ONE DOLLAR; mint mark S below the wreath.",
        designer: "George T. Morgan",
        engraver: "George T. Morgan",
        mintage: 12760000,
        catalogRefs: [
          { system: "KM", code: "110" },
          { system: "VAM", code: "—" },
        ],
        grade: "MS63",
        status: "verified",
        acquiredDate: "2021-03-02",
        acquiredFrom: "Heritage Auctions",
        pricePaid: 65,
        estimatedValue: 95,
        storageLocation: "Album 1, page 3",
        notes:
          "Cartwheel lustre both sides; light bag marks in the left obverse field keep it from a higher mint-state grade. The 1881-S is famously well struck.",
        tags: ["silver", "dollar", "morgan"],
        images: {
          obverse: "/coins/usa-morgan-dollar-1881-obverse.jpg",
          reverse: "/coins/usa-morgan-dollar-1881-reverse.jpg",
        },
        sources: [
          { label: "PCGS CoinFacts — 1881-S $1", url: "https://www.pcgs.com/coinfacts/coin/1881-s-1/7130" },
        ],
      },
      210,
    ),
    seedCoin(
      {
        id: "seed-roman-denarius-hadrian",
        accessionNo: 3,
        title: "Roman Empire Denarius of Hadrian",
        country: "Roman Empire",
        issuer: "Hadrian",
        denomination: "Denarius",
        era: "c. 117–138 AD",
        mint: "Rome",
        composition: "Silver (debased, c. 90%)",
        weightG: 3.3,
        diameterMm: 18,
        shape: "round (irregular flan)",
        edge: "Plain (hammered)",
        obverseDesc:
          "Laureate head of Hadrian right; legend HADRIANVS AVGVSTVS around. Portrait in the mature style of the middle reign.",
        reverseDesc:
          "Salus standing right, feeding a snake held in her arms from a patera; SALVS AVG in field. Slightly off-centre strike on a tight flan.",
        mintage: undefined,
        catalogRefs: [
          { system: "RIC", code: "II.3 137" },
          { system: "RSC", code: "1323" },
        ],
        grade: "Fine",
        confidence: 62,
        status: "pending",
        acquiredDate: "2022-11-19",
        acquiredFrom: "Estate lot, auction",
        pricePaid: 40,
        estimatedValue: 85,
        storageLocation: "Cabinet drawer A, flip 07",
        notes:
          "Attribution tentative — reverse legend partly flat. Compare RIC II.3 137 vs 267 (Pietas reverse); weight and style favour the Salus type. Awaiting review against OCRE plates.",
        tags: ["ancient", "silver", "roman"],
        images: {
          obverse: "/coins/roman-denarius-hadrian-obverse.jpg",
          reverse: "/coins/roman-denarius-hadrian-reverse.jpg",
        },
        sources: [
          { label: "OCRE — Hadrian denarii", url: "https://numismatics.org/ocre/results?q=Hadrian+denarius" },
        ],
      },
      46,
    ),
    seedCoin(
      {
        id: "seed-uk-penny-1901",
        accessionNo: 4,
        title: "United Kingdom Penny 1901 — Victoria",
        country: "United Kingdom",
        issuer: "Victoria",
        denomination: "1 Penny",
        currency: "GBP",
        year: 1901,
        mint: "Royal Mint, London",
        composition: "Bronze (Cu 95 / Sn 4 / Zn 1)",
        weightG: 9.45,
        diameterMm: 30.8,
        shape: "round",
        edge: "Plain",
        obverseDesc:
          "Veiled and diademed bust of Queen Victoria left (“Old Head”); VICTORIA · DEI · GRA · BRITT · REGINA · FID · DEF · IND · IMP around.",
        reverseDesc:
          "Britannia seated right with trident and shield; ONE PENNY in field, date in exergue, lighthouse and ship to either side.",
        designer: "Thomas Brock (obverse), Leonard Charles Wyon (reverse)",
        mintage: 22205568,
        catalogRefs: [
          { system: "KM", code: "790" },
          { system: "Freeman", code: "154" },
        ],
        grade: "EF",
        status: "verified",
        acquiredDate: "2020-09-05",
        acquiredFrom: "London coin fair",
        pricePaid: 18,
        estimatedValue: 35,
        storageLocation: "Album 1, page 7",
        notes:
          "Last year of the veiled-head type — Victoria died in January 1901. Traces of original mint red around the reverse legend.",
        tags: ["bronze", "victoria"],
        images: {
          obverse: "/coins/uk-penny-1901-obverse.jpg",
          reverse: "/coins/uk-penny-1901-reverse.jpg",
        },
        sources: [{ label: "Numista — UK Penny 1901", url: "https://en.numista.com/catalogue/pieces794.html" }],
      },
      260,
    ),
    seedCoin(
      {
        id: "seed-japan-500-yen-2021",
        accessionNo: 5,
        title: "Japan 500 Yen 2021",
        country: "Japan",
        issuer: "Japan Mint",
        denomination: "500 Yen",
        currency: "JPY",
        year: 2021,
        era: "Reiwa 3",
        mint: "Japan Mint, Osaka",
        composition: "Bimetallic clad: CuNi centre / Ni-brass outer",
        weightG: 7.1,
        diameterMm: 26.5,
        thicknessMm: 1.81,
        shape: "round",
        edge: "Reeded (slant reeding with micro-lettering)",
        obverseDesc:
          "Paulownia blossom with the value 500 and 日本国 (State of Japan) above; latent-image numerals visible at an angle.",
        reverseDesc:
          "Bamboo and tachibana orange sprays flanking the value; micro-lettering J·A·P·A·N worked into the background pattern.",
        mintage: 168220000,
        catalogRefs: [{ system: "Y", code: "148" }],
        grade: "UNC",
        status: "verified",
        acquiredDate: "2023-04-11",
        acquiredFrom: "Travel change, Tokyo",
        pricePaid: 4.5,
        estimatedValue: 5,
        storageLocation: "Tray 2, slot 31",
        notes:
          "Third-generation 500 yen with two-colour bimetallic cladding — picked from change at Haneda on the way home. Kept for the anti-counterfeit tech.",
        tags: ["modern", "circulation", "bimetallic"],
        images: {
          obverse: "/coins/japan-500-yen-2021-obverse.jpg",
          reverse: "/coins/japan-500-yen-2021-reverse.jpg",
        },
        sources: [{ label: "Japan Mint — 500 yen (new)", url: "https://www.mint.go.jp/eng/kids/eng_kids_500new.html" }],
      },
      120,
    ),
    seedCoin(
      {
        id: "seed-germany-5-mark-1901",
        accessionNo: 6,
        title: "German States Prussia 5 Mark 1901-A",
        country: "German States",
        issuer: "Prussia — Wilhelm II",
        denomination: "5 Mark",
        currency: "Goldmark",
        year: 1901,
        mint: "Berlin",
        mintMark: "A",
        composition: "Silver .900 / copper .100",
        weightG: 27.78,
        diameterMm: 38,
        thicknessMm: 2.6,
        shape: "round",
        edge: "Lettered: GOTT MIT UNS",
        obverseDesc:
          "Bare head of Wilhelm II right; WILHELM II DEUTSCHER KAISER KÖNIG V. PREUSSEN around, mint mark A below the bust.",
        reverseDesc:
          "Crowned Imperial eagle with spread wings, Prussian shield on breast; DEUTSCHES REICH 1901 · FÜNF MARK around.",
        designer: "Emil Weigand",
        mintage: 2318000,
        catalogRefs: [
          { system: "KM", code: "523" },
          { system: "Jäger", code: "104" },
        ],
        grade: "VF",
        confidence: 71,
        status: "pending",
        acquiredDate: "2023-09-30",
        acquiredFrom: "Online marketplace",
        pricePaid: 32,
        estimatedValue: 55,
        storageLocation: "Cabinet drawer B, flip 02",
        notes:
          "Even circulation wear, old light cleaning on the reverse. Confirm against Jäger 104 die varieties; edge lettering complete and upright.",
        tags: ["silver", "empire", "german-states"],
        images: {
          obverse: "/coins/germany-5-mark-1901-obverse.jpg",
          reverse: "/coins/germany-5-mark-1901-reverse.jpg",
        },
        sources: [{ label: "Numista — Prussia 5 Mark 1901 A", url: "https://en.numista.com/catalogue/pieces6424.html" }],
      },
      12,
    ),
    seedCoin(
      {
        id: "seed-canada-1-cent-1920",
        accessionNo: 7,
        title: "Canada 1 Cent 1920 — George V",
        country: "Canada",
        issuer: "George V",
        denomination: "1 Cent",
        currency: "CAD",
        year: 1920,
        mint: "Royal Canadian Mint, Ottawa",
        composition: "Bronze (Cu 95.5 / Sn 3 / Zn 1.5)",
        weightG: 3.24,
        diameterMm: 19.05,
        shape: "round",
        edge: "Plain",
        obverseDesc: "Crowned bust of George V left; GEORGIVS V DEI GRA: REX ET IND: IMP: around.",
        reverseDesc:
          "ONE CENT · CANADA 1920 within a beaded circle, two maple leaves on a single twig above.",
        designer: "Sir E. B. MacKennal (obverse), W. H. J. Blakemore (reverse)",
        mintage: 15483923,
        catalogRefs: [{ system: "KM", code: "28" }],
        grade: "AU",
        status: "verified",
        acquiredDate: "2018-07-22",
        acquiredFrom: "Grandfather's accumulation",
        pricePaid: 0,
        estimatedValue: 12,
        storageLocation: "Album 2, page 1",
        notes:
          "First year of the small cent — Canada shrank the cent from the large 25.4 mm format this year. Family provenance; never to be sold.",
        tags: ["bronze", "george-v", "provenance"],
        images: {
          obverse: "/coins/canada-1-cent-1920-obverse.jpg",
          reverse: "/coins/canada-1-cent-1920-reverse.jpg",
        },
        sources: [{ label: "Numista — Canada 1 Cent 1920", url: "https://en.numista.com/catalogue/pieces2952.html" }],
      },
      400,
    ),
    seedCoin(
      {
        id: "seed-mexico-8-reales-1894",
        accessionNo: 8,
        title: "Mexico 8 Reales 1894 Mo AM",
        country: "Mexico",
        denomination: "8 Reales",
        year: 1894,
        mint: "Mexico City",
        mintMark: "Mo",
        composition: "Silver .903",
        weightG: 27.07,
        diameterMm: 39,
        shape: "round",
        edge: "Reeded",
        obverseDesc:
          "Mexican eagle perched on a cactus devouring a snake, on a lake-island rock; REPUBLICA MEXICANA around.",
        reverseDesc:
          "Radiant Phrygian “cap of liberty” over rays; denomination 8 R., mint mark Mo, date 1894 and assayer initials A.M. below.",
        engraver: "Manuel de la Peña y Peña (eagle punch tradition)",
        mintage: 5200000,
        catalogRefs: [{ system: "KM", code: "377.10" }],
        grade: "VF",
        status: "verified",
        acquiredDate: "2021-12-04",
        acquiredFrom: "Local dealer, bourse table",
        pricePaid: 48,
        estimatedValue: 75,
        storageLocation: "Album 1, page 5",
        notes:
          "Classic “cap and rays” type struck continuously since 1823 — this coin format circulated worldwide and was legal tender in the US until 1857. Two old chop-like marks in the reverse field.",
        tags: ["silver", "crown-size"],
        images: {
          obverse: "/coins/mexico-8-reales-1894-obverse.jpg",
          reverse: "/coins/mexico-8-reales-1894-reverse.jpg",
        },
        sources: [{ label: "Numista — Mexico 8 Reales 1894 Mo", url: "https://en.numista.com/catalogue/pieces12330.html" }],
      },
      180,
    ),
    seedCoin(
      {
        id: "seed-australia-florin-1927",
        accessionNo: 9,
        title: "Australia Florin 1927 — Canberra",
        country: "Australia",
        issuer: "George V",
        denomination: "1 Florin",
        currency: "AUD (pre-decimal £sd)",
        year: 1927,
        mint: "Melbourne",
        composition: "Silver .925 (sterling)",
        weightG: 11.31,
        diameterMm: 28.5,
        shape: "round",
        edge: "Reeded",
        obverseDesc: "Crowned bust of George V left; GEORGIVS V D. G. BRITT: OMN: REX F. D. IND: IMP: around.",
        reverseDesc:
          "Parliament House, Canberra, within an oval frame; ONE FLORIN above, date and PARLIAMENT HOUSE · AUSTRALIA below.",
        designer: "George Kruger Gray (reverse)",
        mintage: 2000000,
        catalogRefs: [{ system: "KM", code: "31" }],
        grade: "EF",
        status: "verified",
        acquiredDate: "2020-02-15",
        acquiredFrom: "Coin club auction",
        pricePaid: 22,
        estimatedValue: 45,
        storageLocation: "Album 2, page 4",
        notes:
          "Australia's first commemorative coin, marking the opening of (Old) Parliament House. Most were spent; sharp examples are surprisingly scarce.",
        tags: ["silver", "commemorative"],
        images: {
          obverse: "/coins/australia-florin-1927-obverse.jpg",
          reverse: "/coins/australia-florin-1927-reverse.jpg",
        },
        sources: [{ label: "Numista — Australia Florin 1927", url: "https://en.numista.com/catalogue/pieces5215.html" }],
      },
      90,
    ),
    seedCoin(
      {
        id: "seed-india-1-rupee-1947",
        accessionNo: 10,
        title: "India 1 Rupee 1947 — George VI",
        country: "India",
        issuer: "British India — George VI",
        denomination: "1 Rupee",
        currency: "INR",
        year: 1947,
        mint: "Bombay",
        composition: "Nickel",
        weightG: 11.66,
        diameterMm: 30.5,
        shape: "round",
        edge: "Milled with security groove",
        obverseDesc: "Crowned head of George VI left; GEORGE VI KING EMPEROR around.",
        reverseDesc:
          "Indian tiger (Panthera tigris) walking left; ONE RUPEE · INDIA 1947 with the value in four scripts around.",
        mintage: 105666000,
        catalogRefs: [{ system: "KM", code: "557" }],
        grade: "VF",
        status: "verified",
        acquiredDate: "2019-08-15",
        acquiredFrom: "Market find, Kochi",
        pricePaid: 6,
        estimatedValue: 15,
        storageLocation: "Tray 1, slot 05",
        notes:
          "Struck in the year of independence — the last British-Indian rupee type before the 1950 Republic coinage. Bought deliberately on 15 August.",
        tags: ["independence-era", "nickel"],
        images: {
          obverse: "/coins/india-1-rupee-1947-obverse.jpg",
          reverse: "/coins/india-1-rupee-1947-reverse.jpg",
        },
        sources: [{ label: "Numista — India 1 Rupee 1947", url: "https://en.numista.com/catalogue/pieces2565.html" }],
      },
      300,
    ),
    seedCoin(
      {
        id: "seed-ussr-1-rouble-1980",
        accessionNo: 11,
        title: "USSR 1 Rouble 1980 — Moscow Olympics",
        country: "USSR",
        issuer: "Soviet Union",
        denomination: "1 Rouble",
        year: 1980,
        mint: "Leningrad (LMD)",
        composition: "Copper-nickel",
        weightG: 12.8,
        diameterMm: 31,
        thicknessMm: 2.3,
        shape: "round",
        edge: "Lettered",
        obverseDesc:
          "State emblem of the USSR — hammer and sickle globe flanked by wheat sheaves, sun below; СССР and the value 1 РУБЛЬ beneath.",
        reverseDesc:
          "The XXII Olympiad emblem over the Kremlin's Spasskaya tower; МОСКВА and the Olympic rings, date 1980 below.",
        mintage: 5096000,
        catalogRefs: [{ system: "Y", code: "178" }],
        grade: "UNC",
        status: "verified",
        acquiredDate: "2022-05-08",
        acquiredFrom: "Coin show, dealer box",
        pricePaid: 3,
        estimatedValue: 8,
        storageLocation: "Tray 3, slot 12",
        notes:
          "From the first Olympic Games held in the Eastern Bloc; part of a six-coin commemorative rouble series. Mint-bloom intact.",
        tags: ["commemorative", "olympics"],
        images: {
          obverse: "/coins/ussr-1-rouble-1980-obverse.jpg",
          reverse: "/coins/ussr-1-rouble-1980-reverse.jpg",
        },
        sources: [{ label: "Numista — USSR 1 Rouble 1980 Olympics", url: "https://en.numista.com/catalogue/pieces950.html" }],
      },
      60,
    ),
    seedCoin(
      {
        id: "seed-greece-10-drachma-1976",
        accessionNo: 12,
        title: "Greece 10 Drachma 1976 — Democritus",
        country: "Greece",
        denomination: "10 Drachma",
        year: 1976,
        mint: "Athens (Bank of Greece)",
        composition: "Copper-nickel",
        weightG: 10,
        diameterMm: 30,
        shape: "round",
        edge: "Reeded",
        obverseDesc:
          "Head of Democritus left, the atomist philosopher of Abdera; ΔΗΜΟΚΡΙΤΟΣ around.",
        reverseDesc:
          "Stylised atomic orbital model; ΕΛΛΗΝΙΚΗ ΔΗΜΟΚΡΑΤΙΑ and the denomination 10 ΔΡΑΧΜΑΙ with the date.",
        mintage: 13000000,
        catalogRefs: [{ system: "KM", code: "119" }],
        grade: "EF",
        confidence: 55,
        status: "pending",
        acquiredDate: "2024-01-20",
        acquiredFrom: "Mixed world lot",
        pricePaid: 2,
        estimatedValue: 5,
        storageLocation: "Unsorted tray",
        notes:
          "From a bulk world-coin lot; low-confidence auto-attribution — verify the 1976 date vs the near-identical 1978 and 1980 strikes.",
        tags: ["modern", "world-lot"],
        images: {
          obverse: "/coins/greece-10-drachma-1976-obverse.jpg",
          reverse: "/coins/greece-10-drachma-1976-reverse.jpg",
        },
        sources: [{ label: "Numista — Greece 10 Drachma 1976", url: "https://en.numista.com/catalogue/pieces2490.html" }],
      },
      3,
    ),
  ];
}

/**
 * Insert the 12 demo coins if (and only if) the coins table is empty.
 * Sets the localStorage flag `numisma:seeded`. Safe to call on every app start.
 */
export async function seedIfEmpty(): Promise<boolean> {
  const count = await db.coins.count();
  if (count > 0) return false;
  await db.coins.bulkAdd(buildSeedCoins());
  try {
    localStorage.setItem(SEED_FLAG, String(Date.now()));
  } catch {
    /* storage unavailable — non-fatal */
  }
  return true;
}

/** Re-insert the demo set (replaces any seed rows with the same ids). */
export async function restoreSeed(): Promise<number> {
  const seeds = buildSeedCoins();
  await db.coins.bulkPut(seeds);
  try {
    localStorage.setItem(SEED_FLAG, String(Date.now()));
  } catch {
    /* non-fatal */
  }
  return seeds.length;
}

/** Delete every coin in the collection. Returns how many were removed. */
export async function clearAllCoins(): Promise<number> {
  const count = await db.coins.count();
  await db.coins.clear();
  return count;
}

/** Export the whole collection as a JSON string. */
export async function exportJSON(): Promise<string> {
  const coins = await db.coins.orderBy("accessionNo").toArray();
  return JSON.stringify({ app: "numisma", version: 1, exportedAt: new Date().toISOString(), coins }, null, 2);
}

export interface ImportCounts {
  added: number;
  updated: number;
  total: number;
}

/**
 * Import coins from a JSON payload (string produced by exportJSON, or a raw
 * Coin[]). Merges by id: existing ids are updated, new ids are added.
 * Missing accessionNo values are assigned the next available numbers.
 */
export async function importJSON(json: string | Coin[]): Promise<ImportCounts> {
  let parsed: unknown = json;
  if (typeof json === "string") parsed = JSON.parse(json);
  const arr: Coin[] = Array.isArray(parsed)
    ? (parsed as Coin[])
    : ((parsed as { coins?: Coin[] }).coins ?? []);
  if (!Array.isArray(arr) || arr.length === 0) return { added: 0, updated: 0, total: 0 };

  return db.transaction("rw", db.coins, async () => {
    let added = 0;
    let updated = 0;
    let nextAccession =
      ((await db.coins.orderBy("accessionNo").last())?.accessionNo ?? 0) + 1;
    for (const raw of arr) {
      if (!raw || typeof raw.id !== "string" || !raw.id) continue;
      const existing = await db.coins.get(raw.id);
      const now = Date.now();
      const coin: Coin = {
        ...raw,
        accessionNo:
          typeof raw.accessionNo === "number" && raw.accessionNo > 0
            ? raw.accessionNo
            : nextAccession++,
        catalogRefs: raw.catalogRefs ?? [],
        tags: raw.tags ?? [],
        images: raw.images ?? {},
        sources: raw.sources ?? [],
        status: raw.status ?? "draft",
        createdAt: existing?.createdAt ?? raw.createdAt ?? now,
        updatedAt: now,
      };
      await db.coins.put(coin);
      if (existing) updated++;
      else added++;
    }
    return { added, updated, total: added + updated };
  });
}
