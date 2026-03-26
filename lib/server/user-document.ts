import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userDocumentSchema = new Schema(
  {
    name: {
      required: true,
      trim: true,
      type: String
    },
    email: {
      index: true,
      lowercase: true,
      required: true,
      trim: true,
      type: String,
      unique: true
    },
    passwordHash: {
      required: true,
      type: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type UserDocument = InferSchemaType<typeof userDocumentSchema>;

export const UserModel =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userDocumentSchema);
