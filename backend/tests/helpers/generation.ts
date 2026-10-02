import type { AIGeneratedTrip } from "@/types/ai.types.js";

export const validGeneration: AIGeneratedTrip = {
  itinerary: [
    {
      dayNumber: 1,
      activities: [
        {
          title: "Walk",
          description: "Explore the old town.",
          estimatedCostINR: 0,
          timeOfDay: "Morning",
          location: "Town square",
        },
      ],
    },
  ],
  hotels: [
    {
      name: "Guesthouse",
      tier: "Budget",
      estimatedCostPerNightINR: 500,
      rating: 4,
      address: "Town centre",
      amenities: ["WiFi"],
    },
  ],
  estimatedBudget: {
    transport: 100,
    accommodation: 500,
    food: 200,
    activities: 0,
    total: 800,
  },
  packingList: [
    {
      item: "Passport",
      category: "Documents",
      isPacked: false,
      weatherRelevant: false,
    },
  ],
};
