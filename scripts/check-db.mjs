import mongoose from "mongoose";
import { connectToDatabase } from "../lib/server/mongodb.ts";
import { UserModel } from "../lib/server/user-document.ts";
import { TaskModel } from "../lib/server/task-document.ts";
import { FolderModel } from "../lib/server/folder-document.ts";

async function checkDatabase() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB successfully.");

    const userCount = await UserModel.countDocuments();
    const taskCount = await TaskModel.countDocuments();
    const folderCount = await FolderModel.countDocuments();

    console.log(`Total Users: ${userCount}`);
    console.log(`Total Tasks: ${taskCount}`);
    console.log(`Total Folders: ${folderCount}`);

    if (taskCount > 0) {
      const sampleTasks = await TaskModel.find().limit(3).lean();
      console.log("Sample Tasks Data:", JSON.stringify(sampleTasks, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error("Database Check Error:", error);
    process.exit(1);
  }
}

checkDatabase();
