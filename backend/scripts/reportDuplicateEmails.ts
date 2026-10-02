import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required to check for duplicate emails.");
  process.exit(1);
}

type DuplicateEmail = {
  _id: string;
  count: number;
  users: Array<{ _id: mongoose.Types.ObjectId; email: string; name?: string }>;
};

async function reportDuplicateEmails(mongoUri: string): Promise<void> {
  await mongoose.connect(mongoUri);

  const duplicates = await mongoose.connection
    .collection("users")
    .aggregate<DuplicateEmail>([
      {
        $project: {
          email: 1,
          name: 1,
          normalizedEmail: { $toLower: { $trim: { input: "$email" } } },
        },
      },
      {
        $group: {
          _id: "$normalizedEmail",
          count: { $sum: 1 },
          users: { $push: { _id: "$_id", email: "$email", name: "$name" } },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  if (duplicates.length === 0) {
    console.log("No duplicate emails found.");
    return;
  }

  console.error(`Found ${duplicates.length} duplicate email group(s):`);
  console.error(JSON.stringify(duplicates, null, 2));
  process.exitCode = 2;
}

reportDuplicateEmails(mongoUri)
  .catch((error: unknown) => {
    console.error("Duplicate email check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
