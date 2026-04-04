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
    },
    role: {
      default: "user",
      enum: ["user", "admin"],
      required: true,
      type: String
    },
    notifications: [
      {
        createdAt: {
          default: Date.now,
          type: Date
        },
        id: {
          required: true,
          type: String
        },
        notes: String,
        status: {
          default: "pending",
          enum: ["pending", "accepted", "rejected"],
          type: String
        },
        title: {
          required: true,
          type: String
        },
        type: {
          default: "TASK_PROPOSAL",
          type: String
        }
      }
    ]
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
