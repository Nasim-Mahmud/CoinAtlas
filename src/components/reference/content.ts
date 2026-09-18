/**
 * Bundled numismatic reference content (reference.md) — static strings,
 * searchable client-side, zero network. Scholarly voice, collector-grade.
 */

export interface GradingBand {
  code: string;
  name: string;
  sheldon: string;
  description: string;
}

export const GRADING_BANDS: GradingBand[] = [
  {
    code: "G-4",
    name: "Good",
    sheldon: "4–6",
    description:
      "Heavily worn: the design is outlined but flat, legends and date weak but readable. Rims may merge into the lettering.",
  },
  {
    code: "VG-8",
    name: "Very Good",
    sheldon: "8–10",
    description:
      "Well worn with major features clear but soft; at least some letters of the legend fully legible. Rims complete.",
  },
  {
    code: "F-12",
    name: "Fine",
    sheldon: "12–15",
    description:
      "Moderate, even wear across the whole coin; all major details visible, fine lines largely gone. About half the minor detail remains.",
  },
  {
    code: "VF-20/30",
    name: "Very Fine",
    sheldon: "20–35",
    description:
      "Moderate wear on the high points only; all major details clear and most fine detail present. A honest, collectible circulated grade.",
  },
  {
    code: "EF-40/45",
    name: "Extremely Fine",
    sheldon: "40–45",
    description:
      "Light wear on the highest points; nearly all detail sharp, some original mint lustre may survive in protected areas.",
  },
  {
    code: "AU-50/58",
    name: "About Uncirculated",
    sheldon: "50–58",
    description:
      "Traces of friction on the very highest points only; at least half the mint lustre remains. Easily mistaken for uncirculated at a glance.",
  },
  {
    code: "MS-60–70",
    name: "Mint State",
    sheldon: "60–70",
    description:
      "No wear whatsoever — the coin never circulated. Graded 60 to 70 by the quality of strike, lustre, and the number and placement of contact marks.",
  },
];

export interface AnatomyTerm {
  key: string;
  term: string;
  definition: string;
}

export const ANATOMY_TERMS: AnatomyTerm[] = [
  { key: "obverse", term: "Obverse", definition: "The 'heads' side — usually the principal portrait, ruler, or national emblem; the side from which a coin is catalogued." },
  { key: "reverse", term: "Reverse", definition: "The 'tails' side — typically the denomination and secondary design." },
  { key: "edge", term: "Edge", definition: "The third side of a coin: plain, reeded, lettered, or ornamented. Often carries security features." },
  { key: "rim", term: "Rim", definition: "The raised border around each face, protecting the design from wear and aiding stacking." },
  { key: "field", term: "Field", definition: "The flat, undecorated background area of a coin's face against which the devices stand." },
  { key: "relief", term: "Relief", definition: "The raised portions of the design; high points of the relief are the first to show wear." },
  { key: "legend", term: "Legend", definition: "The principal inscription, usually following the rim — the ruler's name, state, or motto." },
  { key: "device", term: "Portrait / Device", definition: "The main design element: a portrait on the obverse, an emblem or scene on the reverse." },
  { key: "date", term: "Date", definition: "The year of issue as struck (not necessarily the year of minting); its position and style help attribute varieties." },
  { key: "mintmark", term: "Mint mark", definition: "A small letter or symbol naming the mint that struck the coin — often tiny, often decisive for value." },
  { key: "exergue", term: "Exergue", definition: "The lower segment of the design, set off by a horizontal line, frequently holding the date or a small inscription." },
];

export interface GlyphItem {
  name: string;
  note?: string;
}

export const SHAPES: GlyphItem[] = [
  { name: "Round", note: "The overwhelming standard since antiquity." },
  { name: "Scalloped", note: "Wavy edge of 8–16 lobes; popular in mid-20th-century Asia." },
  { name: "Square", note: "With rounded corners — e.g. Ceylon, Netherlands Antilles, Bangladesh." },
  { name: "Hexagonal", note: "Six-sided; Indian 3 paise, Egyptian 2 milliemes." },
  { name: "Dodecagonal", note: "Twelve-sided, like the Australian 50 cents and British £1." },
  { name: "Holed", note: "Central hole saves metal and deters counterfeiting — Japanese 5 and 50 yen." },
  { name: "Spanish flower", note: "Four-lobed form used on the Spanish 50 pesetas." },
  { name: "Irregular", note: "Klippe, dump, and hand-struck forms of hammered coinage." },
];

export const EDGES: GlyphItem[] = [
  { name: "Reeded", note: "Parallel grooves; once anti-clipping, now a security and tactile aid." },
  { name: "Smooth", note: "Plain edge, typical of lower denominations." },
  { name: "Lettered", note: "Incuse or raised inscription — 'DECUS ET TUTAMEN' on the British £2." },
  { name: "Grooved", note: "A channel around the edge, sometimes holding a different metal ring." },
  { name: "Interrupted reeding", note: "Reeds in groups separated by smooth gaps — euro 10, 20, 50 cent 'Spanish flower' edge." },
  { name: "Security edge", note: "Micro-engraved symbols or latent images, as on modern £1 and €2." },
  { name: "Ornamented", note: "Vines, stars, or wave patterns struck into the edge." },
];

export interface MintMarkGroup {
  country: string;
  marks: string;
}

export const MINT_MARKS: MintMarkGroup[] = [
  { country: "United States", marks: "CC Carson City · D Denver · O New Orleans · S San Francisco · P / none Philadelphia · W West Point" },
  { country: "France", marks: "A Paris · BB Strasbourg · cornucopia & horn privy marks (modern)" },
  { country: "United Kingdom", marks: "H Heaton (Birmingham) · KN King's Norton · no mark London/Tower Hill · soho mark on coppers" },
  { country: "Germany", marks: "A Berlin · D Munich · F Stuttgart · G Karlsruhe · J Hamburg (Empire & modern)" },
  { country: "Spain", marks: "crowned M Madrid · 6-pointed star + date = year of striking (modern)" },
  { country: "Mexico", marks: "M / Mo Mexico City · Zs Zacatecas · Ga Guadalajara · C Culiacán" },
  { country: "Canada", marks: "H Heaton · C Ottawa (sovereigns) · no mark / W Winnipeg (modern)" },
  { country: "Australia", marks: "S Sydney · M Melbourne · P Perth · dot & scroll privies on early coppers" },
  { country: "Italy", marks: "M Milan · N Naples · R Rome · T Turin · no mark Rome (modern)" },
  { country: "Russia & USSR", marks: "СПБ St Petersburg · М Moscow · Л Leningrad · ММД Moscow Mint" },
  { country: "Japan", marks: "Osaka mint mark (modern) · none on most 20th-century issues" },
  { country: "India", marks: "◆ diamond Mumbai · * star Hyderabad · dot Noida · no mark Kolkata" },
];

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: "Alloy", definition: "A mixture of two or more metals. Coinage alloys — bronze, cupronickel, Nordic gold — are chosen for hardness, colour, and resistance to wear." },
  { term: "Attribution", definition: "The identification of a coin's issuer, date, mint, and catalogue type. In Numisma, attributions you confirm become verified entries." },
  { term: "Bag marks", definition: "Small contact nicks coins receive knocking against each other in mint bags. Expected on uncirculated coins; not the same as wear." },
  { term: "Bimetallic", definition: "A coin of two distinct metal components — typically an inner core and outer ring, as on the 2 euro or British £2." },
  { term: "Brockage", definition: "A mint error where a struck coin sticks to the die and imprints a mirror image into the next blank. Prized by error collectors." },
  { term: "Bullion", definition: "Precious metal valued by weight and fineness rather than face value; bullion coins (Krugerrand, Maple Leaf) trade near melt." },
  { term: "Cast", definition: "Made by pouring molten metal into a mould rather than striking. Most ancient Chinese cash was cast; cast modern coins are usually fakes." },
  { term: "Circulation strike", definition: "A coin struck for ordinary commerce, as opposed to a proof or specimen made for collectors." },
  { term: "Clashed dies", definition: "An error caused when dies strike each other without a blank between them, leaving ghost impressions of the opposite design." },
  { term: "Counterstamp", definition: "A punch or mark applied to an existing coin by a later authority — revalidating it, changing its value, or advertising." },
  { term: "Cud", definition: "A raised, featureless blob where a piece of the die broke away and metal flowed into the void, usually at the rim." },
  { term: "Denomination", definition: "The face value stated or implied on a coin — 2 euro, 50 cents, one penny." },
  { term: "Device", definition: "The principal design element of a coin: a portrait, eagle, building, or emblem." },
  { term: "Die", definition: "The hardened steel stamp that strikes the design into a blank. Coins are struck by an obverse and a reverse die, plus a collar forming the edge." },
  { term: "Die axis", definition: "The rotational alignment of obverse to reverse: 'coin alignment' (180°, as in the US) or 'medal alignment' (0°, as in the euro)." },
  { term: "Die crack", definition: "A fine raised line on a coin caused by a crack in the die — harmless, common, and sometimes collected as a variety." },
  { term: "Effigy", definition: "The portrait of a person — usually the reigning monarch or a personification — on a coin." },
  { term: "Engraver", definition: "The artist who cuts the design into the master die or hub. Often signed with initials hidden in the design." },
  { term: "Exergue", definition: "The lower segment of a coin's design, separated by a horizontal line, often bearing the date or a small inscription." },
  { term: "Field", definition: "The flat background of a coin's face. On proofs the field is mirror-polished; heavy marks in the field lower a grade." },
  { term: "Fineness", definition: "The proportion of precious metal in an alloy, in thousandths: '.925' sterling silver is 92.5% pure." },
  { term: "Flan", definition: "See planchet — the prepared blank of metal before striking." },
  { term: "Hub", definition: "The intermediate positive tool used to sink many identical working dies from one master design." },
  { term: "Incuse", definition: "A design sunk below the field rather than raised in relief — rare on modern coins, common on ancient Greek reverses." },
  { term: "Intrinsic value", definition: "The melt value of a coin's metal content, as distinct from its face value or collector value." },
  { term: "KM number", definition: "The catalogue identifier from Krause–Mishler's Standard Catalog of World Coins, e.g. 'KM 1289'. The default reference for modern world coins." },
  { term: "Legend", definition: "The main inscription of a coin, usually running around the rim — distinct from a motto, which is secondary text." },
  { term: "Lettered edge", definition: "An inscription applied to the edge — a security feature dating to 17th-century milled coinage, still used on £2 and many commemoratives." },
  { term: "Lustre", definition: "The satiny or frosty sheen of a freshly struck coin, caused by flow lines in the metal. Its presence is essential to mint-state grades." },
  { term: "Milled edge", definition: "Another term for a reeded edge — originally the mark of machine-made ('milled') coinage." },
  { term: "Mintage", definition: "The number of pieces of a given issue struck. Low mintage usually means scarcity — but survival rates matter too." },
  { term: "Mint mark", definition: "A small letter or symbol identifying the mint of striking. Record it in your entry — it can change value dramatically." },
  { term: "Mint state", definition: "Uncirculated condition: no wear at all. Abbreviated MS and graded on the 60–70 point band of the Sheldon scale." },
  { term: "Motto", definition: "A secondary inscription expressing a sentiment — 'E PLURIBUS UNUM', 'LIBERTY' — distinct from the main legend." },
  { term: "Numismatics", definition: "The study and collecting of coins, medals, and related objects — from the Greek nomisma, 'current coin'." },
  { term: "Obverse", definition: "The 'heads' side of a coin, bearing the principal portrait or emblem; conventionally the side shown first in catalogues." },
  { term: "Overdate", definition: "A date punched over a previous date on the die — e.g. '1943/2'. A collectable variety, often valuable." },
  { term: "Patina", definition: "The stable surface film a coin acquires with age — green verdigris on bronze, golden-grey on silver. Never clean it off: it protects and authenticates." },
  { term: "Piedfort", definition: "A coin struck on a double-thickness blank, historically for presentation — from the French 'heavy foot'." },
  { term: "Planchet", definition: "The prepared metal blank, weighed and rimmed, ready to be struck into a coin. Also called a flan." },
  { term: "Privy mark", definition: "A small symbol added to a design marking a particular mint, engraver, or occasion — Dutch and French issues are rich in them." },
  { term: "Proof", definition: "A method of manufacture — polished dies, polished blanks, multiple slow strikes — producing mirror fields and frosted devices. A finish, not a grade." },
  { term: "Provenance", definition: "The documented ownership history of a piece. A distinguished provenance adds both authenticity and value." },
  { term: "Reeding", definition: "The parallel grooves on a coin's edge, introduced to make clipping and filing obvious; counted per edge in some catalogues." },
  { term: "Relief", definition: "The raised portions of a design. High-relief coins are dramatic but wear first on the highest points." },
  { term: "Restrike", definition: "A later striking from original or reproduced dies, made after the issue ended — sometimes official, sometimes not." },
  { term: "Reverse", definition: "The 'tails' side of a coin — typically the denomination, arms, or commemorative design." },
  { term: "Rim", definition: "The raised border around each face. It protects the design and is the first thing to check for knocks." },
  { term: "Seigniorage", definition: "The profit a state makes when a coin's face value exceeds the cost of its metal and manufacture." },
  { term: "Series", definition: "A group of related issues — a monarch's coinage, a commemorative programme, a country's standard set." },
  { term: "Sheldon scale", definition: "The 1–70 numerical grading scale devised by William Sheldon in 1949, now universal for grading: 1 is barely identifiable, 70 is perfect." },
  { term: "Specimen", definition: "A collector finish between circulation and proof quality, often with a satin surface. Also a sample coin marked as such." },
  { term: "Toning", definition: "Colour acquired by a silver or copper coin from slow reaction with its environment. Attractive toning adds value; artificial toning subtracts it." },
  { term: "Type", definition: "The basic design of an issue, ignoring dates and minor varieties. A 'type set' collects one example of each design." },
  { term: "Variety", definition: "A minor but distinct difference within an issue — a repunched mint mark, a doubled die, a different privy mark." },
  { term: "Verdigris", definition: "The green patina of copper alloys exposed to air and moisture — stable and desirable when even, corrosive when active." },
  { term: "Wire rim", definition: "A sharp fin of metal at the rim caused by metal squeezing between die and collar under high pressure — common on proofs." },
  { term: "Year set", definition: "A collection of one of each denomination issued in a given year — often sold by mints as 'mint sets'." },
];

export interface CatalogueSystem {
  code: string;
  name: string;
  description: string;
  url?: string;
}

export const CATALOGUE_SYSTEMS: CatalogueSystem[] = [
  { code: "KM", name: "Krause–Mishler", description: "Standard Catalog of World Coins — the default reference for world coinage from 1601 onward.", url: "https://www.numismaster.com" },
  { code: "Y", name: "Yeoman", description: "R.S. Yeoman's earlier numbering for world coins, still cited for 19th–20th century issues." },
  { code: "Schön", name: "Schön", description: "Günter Schön's Weltmünzkatalog — the standard German-language world coin reference." },
  { code: "RIC", name: "Roman Imperial Coinage", description: "The scholarly corpus of Roman imperial coin types by emperor, mint, and issue.", url: "https://numismatics.org/ocre/" },
  { code: "RSC", name: "Seaby", description: "Roman Silver Coins (Seaby/Sear) — a compact, widely cited alternative to RIC." },
  { code: "Fr", name: "Friedberg", description: "Gold Coins of the World — the standard reference for gold coinage by date and type." },
  { code: "N#", name: "Numista", description: "The open community catalogue; Numista numbers are stable public identifiers for modern issues.", url: "https://en.numista.com" },
];

export interface Abbreviation {
  code: string;
  meaning: string;
}

export const ABBREVIATIONS: Abbreviation[] = [
  { code: "AE", meaning: "Bronze or copper alloy (aes) — in ancient coin references" },
  { code: "AR", meaning: "Silver (argentum)" },
  { code: "AV", meaning: "Gold (aurum)" },
  { code: "BI", meaning: "Billon — low-grade silver alloy" },
  { code: "UNC", meaning: "Uncirculated — no wear; equivalent to mint state" },
  { code: "BU", meaning: "Brilliant uncirculated — uncirculated with full mint lustre" },
  { code: "PF / PR", meaning: "Proof — a manufacturing method, not a condition grade" },
  { code: "c.", meaning: "Circa — approximately, used for uncertain ancient dates" },
  { code: "var.", meaning: "Variety — a minor die difference within a catalogue type" },
  { code: "obv. / rev.", meaning: "Obverse / reverse" },
  { code: "ex.", meaning: "Ex collection — provenance, 'formerly in the collection of'" },
  { code: "RR / RRR", meaning: "Rare / extremely rare — dealer rarity shorthand" },
];

/** Letters (A–Z) that have at least one glossary term. */
export function glossaryLetters(terms: GlossaryTerm[] = GLOSSARY): Set<string> {
  return new Set(terms.map((t) => t.term[0].toUpperCase()));
}
