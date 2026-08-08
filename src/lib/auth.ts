import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "coalsense-ai-secret-key-change-in-production";

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

// Role hierarchy for authorization
const rolePermissions: Record<string, string[]> = {
  admin: [
    "manage_users", "manage_mines", "manage_roles",
    "view_dashboard", "run_forecasts", "view_forecasts",
    "view_audit_logs", "upload_data", "enter_production",
    "enter_dispatch", "update_inventory", "view_recommendations",
    "what_if_analysis", "generate_reports", "view_notifications",
  ],
  analyst: [
    "upload_data", "run_forecasts", "view_forecasts",
    "view_dashboard", "generate_reports", "view_recommendations",
    "view_notifications",
  ],
  manager: [
    "view_dashboard", "view_forecasts", "view_recommendations",
    "what_if_analysis", "generate_reports", "view_notifications",
  ],
  operator: [
    "enter_production", "enter_dispatch", "update_inventory",
    "view_dashboard", "view_notifications",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAccess(role: string, requiredPermissions: string[]): boolean {
  return requiredPermissions.every((p) => hasPermission(role, p));
}
