import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "./mongodb";
import { SessionModel } from "./session-document";
import { UserModel } from "./user-document";

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE_NAME = "task-life-session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

export type AuthUser = {
  email: string;
  id: string;
  name: string;
};

export class AuthConflictError extends Error {}

export class AuthInvalidCredentialsError extends Error {}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashSessionToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createSessionToken = () => crypto.randomBytes(32).toString("hex");

const serializeUser = (user: {
  _id: { toString(): string };
  email: string;
  name: string;
}): AuthUser => ({
  email: user.email,
  id: user._id.toString(),
  name: user.name
});

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKey, derivedKey);
}

async function createSession(userId: string) {
  await connectToDatabase();

  const sessionToken = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await SessionModel.create({
    expiresAt,
    sessionTokenHash: hashSessionToken(sessionToken),
    userId
  });

  return sessionToken;
}

async function writeSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function registerUser(params: {
  email: string;
  name: string;
  password: string;
}) {
  await connectToDatabase();

  const email = normalizeEmail(params.email);
  const existingUser = await UserModel.findOne({ email }).lean();

  if (existingUser) {
    throw new AuthConflictError("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(params.password);
  const user = await UserModel.create({
    email,
    name: params.name.trim(),
    passwordHash
  });

  return serializeUser(user);
}

export async function authenticateUser(params: {
  email: string;
  password: string;
}) {
  await connectToDatabase();

  const email = normalizeEmail(params.email);
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AuthInvalidCredentialsError("Invalid email or password.");
  }

  const isValid = await verifyPassword(params.password, user.passwordHash);

  if (!isValid) {
    throw new AuthInvalidCredentialsError("Invalid email or password.");
  }

  return serializeUser(user);
}

export async function startUserSession(userId: string) {
  const sessionToken = await createSession(userId);
  await writeSessionCookie(sessionToken);
}

export async function endCurrentSession() {
  const cookieStore = await cookies();
  const currentSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (currentSession) {
    await connectToDatabase();
    await SessionModel.deleteOne({
      sessionTokenHash: hashSessionToken(currentSession)
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  await connectToDatabase();

  const session = await SessionModel.findOne({
    expiresAt: { $gt: new Date() },
    sessionTokenHash: hashSessionToken(sessionToken)
  }).lean();

  if (!session) {
    return null;
  }

  const user = await UserModel.findById(session.userId).lean();

  if (!user) {
    return null;
  }

  return serializeUser(user);
}

export async function requireAuthenticatedPageUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAuthenticatedApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
