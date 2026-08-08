import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signToken } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const u = user[0];
    if (!u.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    const valid = await verifyPassword(password, u.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      userId: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
    });

    await logAudit({
      userId: u.id,
      action: "LOGIN",
      entity: "users",
      entityId: u.id,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
      token,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
