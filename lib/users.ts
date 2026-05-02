import bcrypt from "bcryptjs";
import { z } from "zod";

const RESERVED = new Set([
  "api",
  "login",
  "signup",
  "verify",
  "forgot",
  "reset",
  "dashboard",
  "event-types",
  "availability",
  "bookings",
  "settings",
  "b",
  "admin",
  "account",
  "static",
  "_next",
  "public",
  "favicon.ico",
  "icon.svg",
  "manifest.json",
  "robots.txt",
  "sitemap.xml",
]);

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "lowercase letters, digits, hyphens; cannot start or end with a hyphen")
  .refine((v) => !RESERVED.has(v), "this username is reserved");

export function isReservedUsername(name: string): boolean {
  return RESERVED.has(name.toLowerCase());
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
