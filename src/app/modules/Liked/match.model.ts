import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatchDocument extends Document {
  users: mongoose.Types.ObjectId[];
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  matchType: "mutual_like" | "profile_based";
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema: Schema<IMatchDocument> = new Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Sorted pair for reliable duplicate detection
    user1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matchType: {
      type: String,
      enum: ["mutual_like", "profile_based"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index on the sorted pair — correct way to prevent duplicate matches
MatchSchema.index({ user1: 1, user2: 1 }, { unique: true });

export const Match: Model<IMatchDocument> = mongoose.model<IMatchDocument>(
  "Match",
  MatchSchema
);

export default Match;

