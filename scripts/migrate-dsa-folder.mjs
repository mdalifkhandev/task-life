import mongoose from "mongoose";

const DSA_FOLDER_NAME = "DSA";
const DSA_FOLDER_COLOR = "#70A5FF";

const isSeededDsaTask = {
  taskId: { $regex: /^(day-\d+|exam-\d+)$/ }
};

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

await mongoose.connect(uri, { dbName: "task_life" });

const db = mongoose.connection.db;
const tasksCollection = db.collection("tasks");
const foldersCollection = db.collection("folders");

const userIds = await tasksCollection.distinct("userId", isSeededDsaTask);

if (userIds.length === 0) {
  console.log("No seeded DSA tasks found.");
  await mongoose.disconnect();
  process.exit(0);
}

const summary = [];

for (const userId of userIds) {
  const existingFolder = await foldersCollection.findOne({
    name: DSA_FOLDER_NAME,
    userId
  });

  const folderId = existingFolder?._id ?? new mongoose.Types.ObjectId();

  if (!existingFolder) {
    await foldersCollection.insertOne({
      _id: folderId,
      color: DSA_FOLDER_COLOR,
      createdAt: new Date(),
      name: DSA_FOLDER_NAME,
      updatedAt: new Date(),
      userId
    });
  }

  const result = await tasksCollection.updateMany(
    {
      ...isSeededDsaTask,
      userId
    },
    {
      $set: {
        folderId,
        source: "dsa",
        updatedAt: new Date()
      }
    }
  );

  summary.push({
    folderId: folderId.toString(),
    matched: result.matchedCount,
    modified: result.modifiedCount,
    userId: userId.toString()
  });
}

console.log(JSON.stringify(summary, null, 2));

await mongoose.disconnect();
