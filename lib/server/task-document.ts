import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const taskDocumentSchema = new Schema(
  {
    userId: {
      index: true,
      ref: "User",
      required: true,
      type: Schema.Types.ObjectId
    },
    folderId: {
      index: true,
      ref: "Folder",
      type: Schema.Types.ObjectId
    },
    source: {
      default: "personal",
      enum: ["personal", "assigned", "dsa"],
      index: true,
      required: true,
      type: String
    },
    proposalId: {
      index: true,
      type: String
    },
    assignedByUserId: {
      index: true,
      ref: "User",
      type: Schema.Types.ObjectId
    },
    taskId: {
      required: true,
      type: String
    },
    title: {
      required: true,
      type: String
    },
    notes: {
      required: true,
      type: String
    },
    done: {
      default: false,
      required: true,
      type: Boolean
    },
    order: {
      index: true,
      required: true,
      type: Number
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type TaskDocument = InferSchemaType<typeof taskDocumentSchema>;

export const TaskModel =
  (mongoose.models.Task as Model<TaskDocument> | undefined) ??
  mongoose.model<TaskDocument>("Task", taskDocumentSchema);
