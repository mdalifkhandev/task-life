import mongoose from "mongoose";

const [, , emailArg, roleArg] = process.argv;

if (!emailArg || !roleArg || !["admin", "user"].includes(roleArg)) {
  console.error("Usage: npm run user:role -- <email> <admin|user>");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

await mongoose.connect(uri, { dbName: "task_life" });

const result = await mongoose.connection.db.collection("users").findOneAndUpdate(
  { email: emailArg.trim().toLowerCase() },
  { $set: { role: roleArg } },
  { returnDocument: "after" }
);

if (!result) {
  console.error(`User not found: ${emailArg}`);
  await mongoose.disconnect();
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      email: result.email,
      role: result.role
    },
    null,
    2
  )
);

await mongoose.disconnect();
