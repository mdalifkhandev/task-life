import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const databaseName = "task_life";
const collectionName = "tasks";
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

const readSeedTasks = () => {
  const filePath = path.join(currentDirectoryPath, "..", "data", "dsa-plan.json");
  const fileContent = fs.readFileSync(filePath, "utf8");
  const tasks = JSON.parse(fileContent);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new Error("data/dsa-plan.json does not contain any tasks.");
  }

  return tasks;
};

const toTaskDocument = (task, order) => ({
  done: Boolean(task.done),
  notes: String(task.notes),
  order,
  taskId: String(task.id),
  title: String(task.title)
});

async function main() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to seed tasks.");
  }

  const tasks = readSeedTasks();
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();

    const database = client.db(databaseName);
    const collection = database.collection(collectionName);
    const existingCount = await collection.countDocuments();

    if (existingCount > 0) {
      console.log(
        `Skipped seeding. MongoDB already has ${existingCount} tasks in ${databaseName}.${collectionName}.`
      );
      return;
    }

    const documents = tasks.map((task, index) => toTaskDocument(task, index));
    await collection.insertMany(documents, { ordered: true });

    console.log(
      `Seeded ${documents.length} tasks into ${databaseName}.${collectionName}.`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
