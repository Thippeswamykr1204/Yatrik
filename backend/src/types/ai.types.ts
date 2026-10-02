export interface AIActivity {
  title: string;
  description: string;
  estimatedCostINR: number;
  timeOfDay: "Morning" | "Afternoon" | "Evening";
  location?: string;
}

export interface AIItineraryDay {
  dayNumber: number;
  activities: AIActivity[];
}

export interface AIHotel {
  name: string;
  tier: "Budget" | "Mid-Range" | "Luxury";
  estimatedCostPerNightINR: number;
  rating: number;
  address?: string;
  amenities?: string[];
}

export interface AIBudget {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

export interface AIPackingItem {
  item: string;
  category: "Documents" | "Clothing" | "Gear" | "Toiletries" | "Other";
  isPacked: boolean;
  weatherRelevant?: boolean;
}

export interface AIGeneratedTrip {
  itinerary: AIItineraryDay[];
  hotels: AIHotel[];
  estimatedBudget: AIBudget;
  packingList: AIPackingItem[];
}

export interface AIGenerateInput {
  destination: string;
  durationDays: number;
  budgetTier: "Low" | "Medium" | "High";
  interests: string[];
}

export interface AIChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AIOptimizedBudget {
  originalBudget: AIBudget;
  optimizedBudget: AIBudget;
  savings: number;
  suggestions: {
    hotels: AIHotel[];
    activityAdjustments: string[];
    generalTips: string[];
  };
}
