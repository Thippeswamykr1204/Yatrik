import { z } from "zod";

export const tripDraftSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(2, "Tell us where you would like to go.")
    .max(100),
  durationDays: z.number().int().min(1).max(30),
  budgetTier: z.enum(["Low", "Medium", "High"]),
  interests: z.array(z.string().max(40)).max(10),
  startDate: z
    .string()
    .refine(
      (value) =>
        !value ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value),
      "Choose a valid departure date.",
    ),
});
export type TripDraft = z.infer<typeof tripDraftSchema>;
export const DRAFT_KEY = "yatrik:trip-draft:v1";
export const initialDraft: TripDraft = {
  destination: "",
  durationDays: 5,
  budgetTier: "Medium",
  interests: [],
  startDate: "",
};
export const budgetOptions = [
  {
    value: "Low",
    label: "The simple life",
    subtitle: "Small spends. Big discoveries.",
    range: "Budget",
    detail: "Guesthouses, local eats, public transport",
  },
  {
    value: "Medium",
    label: "A little of both",
    subtitle: "Comfort with room for adventure.",
    range: "Mid-range",
    detail: "Boutique stays, great food, easy transfers",
  },
  {
    value: "High",
    label: "Something special",
    subtitle: "Make the journey an occasion.",
    range: "Premium",
    detail: "Beautiful hotels, private rides, special experiences",
  },
] as const;
export const interests = [
  { value: "Nature", label: "Into the wild", icon: "Trees" },
  { value: "Food", label: "Food & coffee", icon: "Utensils" },
  { value: "Culture", label: "Art & culture", icon: "Landmark" },
  { value: "Adventure", label: "A little adventure", icon: "Mountain" },
  { value: "Beaches", label: "Slow beach days", icon: "Waves" },
  { value: "Architecture", label: "Old-world wonders", icon: "Building2" },
  { value: "Photography", label: "Through the lens", icon: "Camera" },
  { value: "Spiritual", label: "A moment of peace", icon: "Sun" },
] as const;
export const destinations = [
  {
    name: "Jaipur",
    region: "RAJASTHAN",
    description: "A little royal. A lot of soul.",
    image: "/destinations/jaipur.jpg",
    tag: "Culture & color",
    days: 4,
  },
  {
    name: "Kerala",
    region: "SOUTH INDIA",
    description: "Life, in a slower lane.",
    image: "/destinations/kerala.jpg",
    tag: "Nature & stillness",
    days: 6,
  },
  {
    name: "Goa",
    region: "WEST COAST",
    description: "Follow the sun. Forget the time.",
    image: "/destinations/goa.jpg",
    tag: "Coastal escapes",
    days: 5,
  },
] as const;
export function destinationImage(destination: string) {
  const text = destination.toLowerCase();
  if (/goa|beach|gokarna/.test(text)) return "/destinations/goa.jpg";
  if (/kerala|munnar|kochi|alleppey/.test(text))
    return "/destinations/kerala.jpg";
  if (/jaipur|rajasthan|udaipur|jodhpur|agra|delhi/.test(text))
    return "/destinations/jaipur.jpg";
  return "/destinations/mountains.jpg";
}
export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
export function safeReturnPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/dashboard";
  return value.startsWith("/plan") || value.startsWith("/dashboard")
    ? value
    : "/dashboard";
}
export function readDraft(): TripDraft {
  try {
    const result = tripDraftSchema.safeParse(
      JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"),
    );
    if (result.success) return result.data;
  } catch {
    /* Private browsing can make storage unavailable. The form remains usable. */
  }
  return { ...initialDraft, interests: [] };
}
export function saveDraft(draft: TripDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Storage is optional, not a prerequisite for planning. */
  }
}
