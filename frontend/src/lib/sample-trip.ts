import type { Trip } from "@/types/models";

/** Hand-written, illustrative itinerary. Never presented as live AI output or a booking. */
export const sampleTrip: Trip = {
  _id: "sample",
  userId: "sample",
  destination: "Kochi & Alleppey, Kerala",
  durationDays: 3,
  budgetTier: "Medium",
  interests: ["Nature", "Food", "Culture"],
  status: "draft",
  generationStatus: "completed",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  itinerary: [
    {
      dayNumber: 1,
      activities: [
        {
          title: "A slow morning in Fort Kochi",
          description:
            "Start with a local breakfast, then walk the leafy lanes around St. Francis Church. Leave time for the galleries and little shops you stumble upon.",
          timeOfDay: "Morning",
          location: "Fort Kochi, Kerala",
          estimatedCostINR: 450,
          completed: false,
        },
        {
          title: "Stories & spice in Mattancherry",
          description:
            "Explore the palace area and the old spice-trading streets. Stop for a Kerala lunch before browsing the independent shops around Jew Town. Check museum opening days before setting off.",
          timeOfDay: "Afternoon",
          location: "Mattancherry, Kochi",
          estimatedCostINR: 650,
          completed: false,
        },
        {
          title: "Golden hour by the fishing nets",
          description:
            "Walk along the waterfront as the light softens around the Chinese fishing nets. Finish with a seafood dinner, or a vegetarian Kerala thali, nearby.",
          timeOfDay: "Evening",
          location: "Chinese Fishing Nets, Kochi",
          estimatedCostINR: 800,
          completed: false,
        },
      ],
    },
    {
      dayNumber: 2,
      activities: [
        {
          title: "Take the scenic route to Alleppey",
          description:
            "Travel south by train or a pre-arranged transfer. Drop your bag at a waterside homestay and ease into a different rhythm. Confirm current schedules and fares locally.",
          timeOfDay: "Morning",
          location: "Alappuzha, Kerala",
          estimatedCostINR: 600,
          completed: false,
        },
        {
          title: "An afternoon on the backwaters",
          description:
            "Choose a locally operated small-boat trip through the quieter canals. Watch village life unfold from the water. Agree on the route, duration, life jackets, and price before boarding.",
          timeOfDay: "Afternoon",
          location: "Alleppey Backwaters, Kerala",
          estimatedCostINR: 1800,
          completed: false,
        },
        {
          title: "Sunset, sand & absolutely no hurry",
          description:
            "Find a spot on Alappuzha Beach for the evening light. Try a small local café for dinner, and let the day end without another thing to tick off.",
          timeOfDay: "Evening",
          location: "Alappuzha Beach, Kerala",
          estimatedCostINR: 600,
          completed: false,
        },
      ],
    },
    {
      dayNumber: 3,
      activities: [
        {
          title: "One more quiet morning",
          description:
            "Wake up early for a short walk by the canals. Ask your host about a local breakfast of puttu and kadala curry, or appam with vegetable stew.",
          timeOfDay: "Morning",
          location: "Alappuzha, Kerala",
          estimatedCostINR: 300,
          completed: false,
        },
        {
          title: "A little piece of Kerala to take home",
          description:
            "Browse a local market for spices or coir crafts, then return toward Kochi. Allow a generous buffer for your onward train or flight; airport transfers are not included in this sample.",
          timeOfDay: "Afternoon",
          location: "Kochi, Kerala",
          estimatedCostINR: 900,
          completed: false,
        },
        {
          title: "The last cup of chai",
          description:
            "If your departure allows, find a café and write down your favorite small moment from the trip. Some things are worth remembering before you get home.",
          timeOfDay: "Evening",
          location: "Kochi, Kerala",
          estimatedCostINR: 200,
          completed: false,
        },
      ],
    },
  ],
  hotels: [
    {
      name: "Fort Kochi heritage guesthouse",
      tier: "Mid-Range",
      estimatedCostPerNightINR: 3000,
      rating: 0,
      address: "Look around the Fort Kochi heritage district",
      amenities: [
        "Private room",
        "Walkable neighborhood",
        "Check breakfast availability",
      ],
    },
    {
      name: "Alleppey waterside homestay",
      tier: "Budget",
      estimatedCostPerNightINR: 2000,
      rating: 0,
      address: "Look near the Alappuzha backwaters",
      amenities: ["Local host", "Waterfront setting", "Ask about transfers"],
    },
  ],
  estimatedBudget: {
    transport: 2200,
    accommodation: 5000,
    food: 2400,
    activities: 2000,
    total: 11600,
  },
  packingList: [
    {
      item: "Photo ID and booking confirmations",
      category: "Documents",
      isPacked: false,
    },
    {
      item: "Lightweight, breathable clothes",
      category: "Clothing",
      isPacked: false,
    },
    {
      item: "A light layer for temples and evenings",
      category: "Clothing",
      isPacked: false,
    },
    {
      item: "Comfortable walking shoes",
      category: "Clothing",
      isPacked: false,
    },
    { item: "Reusable water bottle", category: "Gear", isPacked: false },
    {
      item: "Power bank and charging cable",
      category: "Gear",
      isPacked: false,
    },
    {
      item: "Sun protection and insect repellent",
      category: "Toiletries",
      isPacked: false,
    },
    {
      item: "Compact umbrella or rain jacket",
      category: "Gear",
      isPacked: false,
      weatherRelevant: true,
    },
  ],
};
