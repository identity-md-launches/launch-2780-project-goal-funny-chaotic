export const HEADS = [
  { id: "sunglasses", name: "Sunglasses", subtitle: "墨镜 · zero eye contact" },
  {
    id: "cooker",
    name: "Pressure cooker",
    subtitle: "高压锅 · under pressure",
  },
  { id: "cone", name: "Traffic cone", subtitle: "A walking road closure" },
  { id: "banana", name: "Banana peel", subtitle: "Potassium-powered fashion" },
  { id: "dunce", name: "Dunce cap", subtitle: "One brain cell. On leave." },
  { id: "crown", name: "Tiny crown", subtitle: "King of the bedding" },
  { id: "vr", name: "VR headset", subtitle: "Reality has been declined" },
] as const;
export const HANDS = [
  { id: "sword", name: "Sword", subtitle: "For cutting the cheese" },
  { id: "watergun", name: "Water gun", subtitle: "Aggressively refreshing" },
  { id: "brush", name: "Toilet brush", subtitle: "厕所刷 · squeaky clean" },
  { id: "plunger", name: "Plunger", subtitle: "吸马桶的 · liquidity provider" },
  { id: "spoon", name: "Giant spoon", subtitle: "Just one little bite" },
  {
    id: "chicken",
    name: "Rubber chicken",
    subtitle: "Emotional support poultry",
  },
  { id: "selfie", name: "Selfie stick", subtitle: "Do it for the squeek" },
  { id: "saber", name: "Lightsaber", subtitle: "May the fluff be with you" },
] as const;
export const EXTRAS = [
  { id: "none", name: "No extra", subtitle: "Already quite a lot" },
  { id: "mustache", name: "Mustache", subtitle: "Definitely a grown adult" },
  { id: "cape", name: "Cape", subtitle: "Super. Mostly hamster." },
  { id: "rocket", name: "Tiny rocket", subtitle: "Unlicensed space program" },
  { id: "googly", name: "Googly eyes", subtitle: "Absolutely no thoughts" },
] as const;
export type Outfit = {
  head: (typeof HEADS)[number]["id"];
  hand: (typeof HANDS)[number]["id"];
  extra: (typeof EXTRAS)[number]["id"];
};
export const DEFAULT_OUTFIT: Outfit = {
  head: "cooker",
  hand: "plunger",
  extra: "none",
};
export function validOutfit(value: unknown): Outfit {
  const v = value as Partial<Outfit> | null;
  return v &&
    HEADS.some((x) => x.id === v.head) &&
    HANDS.some((x) => x.id === v.hand) &&
    EXTRAS.some((x) => x.id === v.extra)
    ? (v as Outfit)
    : { ...DEFAULT_OUTFIT };
}
export function combo(outfit: Outfit): {
  name: string;
  bonus: number;
  description: string;
} {
  if (outfit.head === "cooker" && ["brush", "plunger"].includes(outfit.hand))
    return {
      name: "Domestic menace",
      bonus: 2,
      description: "+2 points per collectible. Do not try this at home.",
    };
  if (outfit.head === "crown" && outfit.hand === "spoon")
    return {
      name: "His snackjesty",
      bonus: 3,
      description: "+3 points per collectible. A royal appetite.",
    };
  if (outfit.head === "vr" && outfit.hand === "saber")
    return {
      name: "Rodent of the future",
      bonus: 3,
      description: "+3 points per collectible. The future is fluffy.",
    };
  if (outfit.extra === "mustache" && outfit.hand === "chicken")
    return {
      name: "Suspicious gentleman",
      bonus: 2,
      description: "+2 points per collectible. Nothing to see here.",
    };
  return {
    name: "Certified little freak",
    bonus: 1,
    description: "+1 point per collectible. Questionable choices pay off.",
  };
}
