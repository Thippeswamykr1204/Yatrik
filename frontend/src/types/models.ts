export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Activity {
  _id?: string;
  title: string;
  description: string;
  estimatedCostINR: number;
  timeOfDay: "Morning" | "Afternoon" | "Evening";
  location?: string;
  completed: boolean;
}

export interface ItineraryDay {
  dayNumber: number;
  activities: Activity[];
}

export interface Hotel {
  _id?: string;
  name: string;
  tier: "Budget" | "Mid-Range" | "Luxury";
  estimatedCostPerNightINR: number;
  rating: number;
  address?: string;
  amenities?: string[];
}

export interface Budget {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

export interface PackingItem {
  _id?: string;
  item: string;
  category: "Documents" | "Clothing" | "Gear" | "Toiletries" | "Other";
  isPacked: boolean;
  weatherRelevant?: boolean;
}

export interface Trip {
  _id: string;
  userId: string;
  destination: string;
  durationDays: number;
  budgetTier: "Low" | "Medium" | "High";
  interests: string[];
  startDate?: string;
  endDate?: string;
  itinerary: ItineraryDay[];
  hotels: Hotel[];
  estimatedBudget: Budget;
  packingList: PackingItem[];
  status: "draft" | "completed" | "archived";
  generationStatus?: "idle" | "queued" | "generating" | "completed" | "failed";
  generationJobId?: string;
  generationStage?: string;
  generationError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripStats {
  totalTrips: number;
  draftTrips: number;
  completedTrips: number;
  archivedTrips: number;
  totalDaysPlanned: number;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp?: Date;
}

export interface OptimizedBudget {
  originalBudget: Budget;
  optimizedBudget: Budget;
  savings: number;
  suggestions: {
    hotels: Hotel[];
    activityAdjustments: string[];
    generalTips: string[];
  };
}
