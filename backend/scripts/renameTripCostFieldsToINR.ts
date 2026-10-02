import dotenv from "dotenv";
import mongoose, { Document, Types } from "mongoose";

dotenv.config({ path: ".env.local" });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required to migrate trip cost fields.");
  process.exit(1);
}

type LegacyActivity = { estimatedCostUSD?: number };
type LegacyHotel = { estimatedCostPerNightUSD?: number };
type LegacyTrip = Document & {
  _id: Types.ObjectId;
  itinerary?: Array<{ activities?: LegacyActivity[] }>;
  hotels?: LegacyHotel[];
};

async function migrateTripCostFields(mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);

  const trips = mongoose.connection.collection<LegacyTrip>("trips");
  const cursor = trips.find({
    $or: [
      { "itinerary.activities.estimatedCostUSD": { $exists: true } },
      { "hotels.estimatedCostPerNightUSD": { $exists: true } },
    ],
  });

  let migrated = 0;

  for await (const trip of cursor) {
    const $set: Record<string, number> = {};
    const $unset: Record<string, ""> = {};

    trip.itinerary?.forEach((day, dayIndex) => {
      day.activities?.forEach((activity, activityIndex) => {
        if (activity.estimatedCostUSD !== undefined) {
          const base = `itinerary.${dayIndex}.activities.${activityIndex}`;
          $set[`${base}.estimatedCostINR`] = activity.estimatedCostUSD;
          $unset[`${base}.estimatedCostUSD`] = "";
        }
      });
    });

    trip.hotels?.forEach((hotel, hotelIndex) => {
      if (hotel.estimatedCostPerNightUSD !== undefined) {
        const base = `hotels.${hotelIndex}`;
        $set[`${base}.estimatedCostPerNightINR`] =
          hotel.estimatedCostPerNightUSD;
        $unset[`${base}.estimatedCostPerNightUSD`] = "";
      }
    });

    if (Object.keys($set).length > 0) {
      await trips.updateOne({ _id: trip._id }, { $set, $unset });
      migrated += 1;
    }
  }

  console.log(`Migrated cost field names on ${migrated} trip document(s).`);
}

migrateTripCostFields(mongoUri)
  .catch((error: unknown) => {
    console.error("Trip cost field migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
