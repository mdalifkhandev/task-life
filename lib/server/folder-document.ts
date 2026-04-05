import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const folderDocumentSchema = new Schema(
  {
    userId: {
      index: true,
      ref: "User",
      required: true,
      type: Schema.Types.ObjectId
    },
    name: {
      required: true,
      trim: true,
      type: String
    },
    color: {
      default: "#6366f1",
      type: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type FolderDocument = InferSchemaType<typeof folderDocumentSchema>;

export const FolderModel =
  (mongoose.models.Folder as Model<FolderDocument> | undefined) ??
  mongoose.model<FolderDocument>("Folder", folderDocumentSchema);
