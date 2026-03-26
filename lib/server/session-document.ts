import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const sessionDocumentSchema = new Schema(
  {
    userId: {
      index: true,
      ref: "User",
      required: true,
      type: Schema.Types.ObjectId
    },
    sessionTokenHash: {
      index: true,
      required: true,
      type: String,
      unique: true
    },
    expiresAt: {
      index: true,
      required: true,
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type SessionDocument = InferSchemaType<typeof sessionDocumentSchema>;

export const SessionModel =
  (mongoose.models.Session as Model<SessionDocument> | undefined) ??
  mongoose.model<SessionDocument>("Session", sessionDocumentSchema);
