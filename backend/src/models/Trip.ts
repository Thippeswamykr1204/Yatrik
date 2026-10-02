import mongoose, { Schema, Document } from "mongoose";

export interface IActivity {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  estimatedCostINR: number;
  timeOfDay: "Morning" | "Afternoon" | "Evening";
  location?: string;
  completed: boolean;
}

export interface IItineraryDay {
  dayNumber: number;
  activities: IActivity[];
}

export interface IHotel {
  _id?: mongoose.Types.ObjectId;
  name: string;
  tier: "Budget" | "Mid-Range" | "Luxury";
  estimatedCostPerNightINR: number;
  rating: number;
  address?: string;
  amenities?: string[];
}

export interface IBudget {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

export interface IPackingItem {
  _id?: mongoose.Types.ObjectId;
  item: string;
  category: "Documents" | "Clothing" | "Gear" | "Toiletries" | "Other";
  isPacked: boolean;
  weatherRelevant?: boolean;
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  destination: string;
  durationDays: number;
  budgetTier: "Low" | "Medium" | "High";
  interests: string[];
  startDate?: Date;
  endDate?: Date;
  itinerary: IItineraryDay[];
  hotels: IHotel[];
  estimatedBudget: IBudget;
  packingList: IPackingItem[];
  status: "draft" | "completed" | "archived";
  generationStatus: "idle" | "queued" | "generating" | "completed" | "failed";
  generationJobId?: string;
  generationStage?:
    | "preparing"
    | "generating"
    | "validating"
    | "saving"
    | "completed"
    | "failed";
  generationError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      maxlength: [200, "Activity title must not exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Activity description must not exceed 1000 characters"],
    },
    estimatedCostINR: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    timeOfDay: {
      type: String,
      enum: {
        values: ["Morning", "Afternoon", "Evening"],
        message: "timeOfDay must be Morning, Afternoon, or Evening",
      },
      default: "Morning",
    },
    location: {
      type: String,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const itineraryDaySchema = new Schema<IItineraryDay>(
  {
    dayNumber: {
      type: Number,
      required: [true, "Day number is required"],
      min: [1, "Day number must be at least 1"],
      max: [30, "Day number cannot exceed 30"],
      validate: {
        validator: Number.isInteger,
        message: "Day number must be an integer",
      },
    },
    activities: {
      type: [activitySchema],
      default: [],
    },
  },
  { _id: false },
);

const hotelSchema = new Schema<IHotel>(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      maxlength: [200, "Hotel name must not exceed 200 characters"],
    },
    tier: {
      type: String,
      enum: {
        values: ["Budget", "Mid-Range", "Luxury"],
        message: "tier must be Budget, Mid-Range, or Luxury",
      },
      required: true,
    },
    estimatedCostPerNightINR: {
      type: Number,
      required: [true, "Cost per night is required"],
      min: [0, "Cost cannot be negative"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    address: {
      type: String,
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
  },
  { _id: true },
);

const budgetSchema = new Schema<IBudget>(
  {
    transport: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    accommodation: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    food: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    activities: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
  },
  { _id: false },
);

const packingItemSchema = new Schema<IPackingItem>(
  {
    item: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Item name must not exceed 100 characters"],
    },
    category: {
      type: String,
      enum: {
        values: ["Documents", "Clothing", "Gear", "Toiletries", "Other"],
        message:
          "category must be one of: Documents, Clothing, Gear, Toiletries, Other",
      },
      required: true,
    },
    isPacked: {
      type: Boolean,
      default: false,
    },
    weatherRelevant: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const tripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
      immutable: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [100, "Destination must not exceed 100 characters"],
    },
    durationDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
      max: [30, "Duration cannot exceed 30 days"],
      validate: {
        validator: Number.isInteger,
        message: "Duration must be an integer",
      },
    },
    budgetTier: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "budgetTier must be Low, Medium, or High",
      },
      required: [true, "Budget tier is required"],
    },
    interests: {
      type: [String],
      default: [],
      maxlength: [20, "Cannot have more than 20 interests"],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    itinerary: {
      type: [itineraryDaySchema],
      default: [],
    },
    hotels: {
      type: [hotelSchema],
      default: [],
    },
    estimatedBudget: {
      type: budgetSchema,
      default: {
        transport: 0,
        accommodation: 0,
        food: 0,
        activities: 0,
        total: 0,
      },
    },
    packingList: {
      type: [packingItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "completed", "archived"],
        message: "status must be draft, completed, or archived",
      },
      default: "draft",
    },
    generationStatus: {
      type: String,
      enum: ["idle", "queued", "generating", "completed", "failed"],
      default: "idle",
    },
    generationJobId: { type: String, index: true, sparse: true },
    generationStage: {
      type: String,
      enum: [
        "preparing",
        "generating",
        "validating",
        "saving",
        "completed",
        "failed",
      ],
    },
    generationError: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ userId: 1, destination: 1 });
tripSchema.index({ userId: 1, status: 1 });

export const Trip = mongoose.model<ITrip>("Trip", tripSchema);
