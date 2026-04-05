import { type Filter, type UpdateFilter } from "mongodb";
import mongoose from "mongoose";
import { type Task, type TaskSource } from "@/lib/task-plan-core";
import { FolderModel } from "./folder-document";
import { connectToDatabase } from "./mongodb";
import { TaskModel } from "./task-document";
import { UserModel } from "./user-document";

type TaskRecord = {
  _id: mongoose.Types.ObjectId;
  assignedByUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  done: boolean;
  folderId?: mongoose.Types.ObjectId;
  notes: string;
  order: number;
  proposalId?: string;
  source?: TaskSource;
  taskId: string;
  title: string;
  updatedAt: Date;
  userId: mongoose.Types.ObjectId;
};

type TaskQueryOptions = {
  folderId?: string;
  source?: TaskSource;
};

type ProposalNotification = {
  createdAt: Date;
  id: string;
  notes?: string;
  senderEmail?: string;
  senderName?: string;
  senderUserId?: string;
  status: "accepted" | "pending" | "rejected";
  title: string;
  type: "TASK_PROPOSAL";
};

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const getTaskCollection = () => {
  const database = mongoose.connection.db;

  if (!database) {
    throw new Error("Database connection is not ready");
  }

  return database.collection<TaskRecord>(TaskModel.collection.name);
};

const serializeTask = (task: {
  _id: mongoose.Types.ObjectId | string;
  done: boolean;
  folderId?: mongoose.Types.ObjectId | string | null;
  notes: string;
  source?: TaskSource;
  title: string;
}): Task => ({
  done: task.done,
  folderId: task.folderId ? task.folderId.toString() : undefined,
  id: task._id.toString(),
  notes: task.notes,
  source: task.source ?? "personal",
  title: task.title
});

const buildSourceFilter = (source?: TaskSource): Filter<TaskRecord> => {
  if (source === "assigned") {
    return { source: "assigned" };
  }

  if (source === "personal") {
    return {
      $or: [
        { source: "personal" },
        { source: { $exists: false } }
      ]
    };
  }

  return {};
};

export async function readUserTasks(
  userId: string,
  options: TaskQueryOptions = {}
) {
  await connectToDatabase();
  const query: Filter<TaskRecord> = {
    ...buildSourceFilter(options.source),
    userId: toObjectId(userId)
  };

  if (options.folderId) {
    query.folderId = toObjectId(options.folderId);
  }

  const documents = await getTaskCollection()
    .find(query)
    .sort({ done: 1, order: 1, createdAt: -1 })
    .toArray();

  return documents.map(serializeTask);
}

export async function createUserTask(params: {
  assignedByUserId?: string;
  folderId?: string;
  notes: string;
  proposalId?: string;
  source?: TaskSource;
  title: string;
  userId: string;
}) {
  await connectToDatabase();

  const userObjectId = toObjectId(params.userId);
  const folderObjectId = params.folderId ? toObjectId(params.folderId) : undefined;
  const taskCollection = getTaskCollection();
  const count = await taskCollection.countDocuments({ userId: userObjectId });

  const newTask: TaskRecord = {
    _id: new mongoose.Types.ObjectId(),
    ...(params.assignedByUserId
      ? { assignedByUserId: toObjectId(params.assignedByUserId) }
      : {}),
    ...(folderObjectId ? { folderId: folderObjectId } : {}),
    ...(params.proposalId ? { proposalId: params.proposalId } : {}),
    createdAt: new Date(),
    done: false,
    notes: params.notes,
    order: count,
    source: params.source ?? "personal",
    taskId: `task-${Date.now()}`,
    title: params.title,
    updatedAt: new Date(),
    userId: userObjectId
  };

  await taskCollection.insertOne(newTask);
  return serializeTask(newTask);
}

export async function updateUserTask(params: {
  details?: string;
  done?: boolean;
  folderId?: string;
  taskId: string;
  title?: string;
  userId: string;
}) {
  await connectToDatabase();

  const update: UpdateFilter<TaskRecord> = {
    $set: {
      updatedAt: new Date()
    }
  };

  if (typeof params.done === "boolean") {
    update.$set = {
      ...update.$set,
      done: params.done
    };
  }

  if (typeof params.details === "string") {
    update.$set = {
      ...update.$set,
      notes: params.details
    };
  }

  if (typeof params.title === "string") {
    update.$set = {
      ...update.$set,
      title: params.title
    };
  }

  if (typeof params.folderId === "string") {
    if (params.folderId === "none" || params.folderId === "") {
      update.$unset = {
        ...(update.$unset ?? {}),
        folderId: ""
      };
    } else {
      update.$set = {
        ...update.$set,
        folderId: toObjectId(params.folderId)
      };
    }
  }

  const updatedTask = await getTaskCollection().findOneAndUpdate(
    {
      _id: toObjectId(params.taskId),
      userId: toObjectId(params.userId)
    },
    update,
    { returnDocument: "after" }
  );

  return updatedTask ? serializeTask(updatedTask) : null;
}

export async function deleteUserTask(userId: string, taskId: string) {
  await connectToDatabase();

  await getTaskCollection().deleteOne({
    _id: toObjectId(taskId),
    userId: toObjectId(userId)
  });
}

export async function readUserFolders(userId: string) {
  await connectToDatabase();

  const folders = await FolderModel.find({ userId })
    .sort({ createdAt: 1 })
    .lean();

  return folders.map((folder) => ({
    ...folder,
    _id: folder._id.toString(),
    userId: folder.userId.toString()
  }));
}

export async function readUserNotifications(userId: string) {
  await connectToDatabase();

  const user = await UserModel.findById(userId).lean();

  return (user?.notifications ?? []).map((notification) => ({
    createdAt: notification.createdAt.toISOString(),
    id: notification.id,
    notes: notification.notes ?? undefined,
    senderEmail: notification.senderEmail ?? undefined,
    senderName: notification.senderName ?? undefined,
    senderUserId: notification.senderUserId ?? undefined,
    status: notification.status,
    title: notification.title,
    type: notification.type as "TASK_PROPOSAL"
  }));
}

export async function createUserFolder(
  userId: string,
  name: string,
  color?: string
) {
  await connectToDatabase();
  return FolderModel.create({ color, name, userId });
}

export async function updateUserFolder(params: {
  color?: string;
  folderId: string;
  name?: string;
  userId: string;
}) {
  await connectToDatabase();

  const update: { color?: string; name?: string } = {};

  if (typeof params.name === "string") {
    update.name = params.name.trim();
  }

  if (typeof params.color === "string") {
    update.color = params.color;
  }

  const folder = await FolderModel.findOneAndUpdate(
    { _id: params.folderId, userId: params.userId },
    update,
    { new: true }
  ).lean();

  if (!folder) {
    return null;
  }

  return {
    ...folder,
    _id: folder._id.toString(),
    userId: folder.userId.toString()
  };
}

export async function deleteUserFolder(userId: string, folderId: string) {
  await connectToDatabase();

  await getTaskCollection().updateMany(
    {
      folderId: toObjectId(folderId),
      userId: toObjectId(userId)
    },
    {
      $set: { updatedAt: new Date() },
      $unset: { folderId: "" }
    }
  );

  await FolderModel.deleteOne({ _id: folderId, userId });
}

export async function sendTaskProposal(
  adminUserId: string,
  targetUserEmail: string,
  title: string,
  notes: string
) {
  await connectToDatabase();

  const adminUser = await UserModel.findById(adminUserId).lean();

  if (!adminUser || adminUser.role !== "admin") {
    throw new Error("Only admins can assign tasks");
  }

  const user = await UserModel.findOne({
    email: targetUserEmail.trim().toLowerCase()
  }).lean();

  if (!user) {
    throw new Error("User not found");
  }

  const proposal: ProposalNotification = {
    createdAt: new Date(),
    id: `prop-${Date.now()}`,
    notes,
    senderEmail: adminUser.email,
    senderName: adminUser.name,
    senderUserId: adminUser._id.toString(),
    status: "pending",
    title,
    type: "TASK_PROPOSAL"
  };

  await UserModel.updateOne(
    { _id: user._id },
    { $push: { notifications: proposal } }
  );

  return proposal;
}

export async function respondToProposal(
  userId: string,
  proposalId: string,
  action: "accepted" | "rejected"
) {
  await connectToDatabase();

  const user = await UserModel.findOne({ _id: userId });

  if (!user) {
    throw new Error("User not found");
  }

  const notification = user.notifications.find(
    (item) => item.id === proposalId
  ) as ProposalNotification | undefined;

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.status !== "pending") {
    throw new Error("This proposal has already been handled");
  }

  if (action === "accepted") {
    await createUserTask({
      assignedByUserId: notification.senderUserId,
      notes: notification.notes || "",
      proposalId: notification.id,
      source: "assigned",
      title: notification.title,
      userId
    });
  }

  await UserModel.updateOne(
    { _id: userId, "notifications.id": proposalId },
    { $set: { "notifications.$.status": action } }
  );
}
