import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const taskDocumentSchema = new Schema(
  {
    taskId: {
      required: true,
      type: String,
      unique: true
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
