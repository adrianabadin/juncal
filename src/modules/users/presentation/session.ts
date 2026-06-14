import { cookies } from "next/headers";
import { Role } from "@users/domain/enums/Role";
import { PrismaUserRepository } from "@users/infrastructure/persistence/PrismaUserRepository";

const COOKIE_NAME = "juncal_session";

// TODO: sign/encrypt the session cookie before production
// Storing raw userId is acceptable for this dev iteration only.

export interface Actor {
  userId: string;
  role: Role;
  isActive: boolean;
  name: string;
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8-hour shift
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentActor(): Promise<Actor | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  const repo = new PrismaUserRepository();
  const user = await repo.findById(cookie.value);
  if (!user) return null;

  return {
    userId: user.id,
    role: user.role,
    isActive: user.isActive,
    name: user.name,
  };
}
