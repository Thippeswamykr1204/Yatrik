import mongoose, { Schema, Document } from "mongoose";

interface IAIGenerationLogFields {
  userId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;
  jobId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cacheHit: boolean;
  status: "success" | "failed";
  createdAt: Date;
}

// Omit Document's own `model()` method so our `model: string` field doesn't collide with it.
export type IAIGenerationLog = IAIGenerationLogFields & Omit<Document, "model">;

const aiGenerationLogSchema = new Schema<IAIGenerationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    jobId: { type: String, required: true, index: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0, min: 0 },
    outputTokens: { type: Number, default: 0, min: 0 },
    latencyMs: { type: Number, default: 0, min: 0 },
    cacheHit: { type: Boolean, default: false },
    status: { type: String, enum: ["success", "failed"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

aiGenerationLogSchema.index({ userId: 1, createdAt: -1 });

export const AIGenerationLog = mongoose.model<IAIGenerationLog>(
  "AIGenerationLog",
  aiGenerationLogSchema,
);
