import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "d1_session";
type AppRole = "admin" | "dispatchAdmin";
type SessionPayload = {
  role: AppRole;
  email: string;
  displayName: string;
  exp: number;
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let session: SessionPayload | null = null;
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as SessionPayload;
    const roleIsValid = parsed.role === "admin" || parsed.role === "dispatchAdmin";
    const isNotExpired = parsed.exp > Math.floor(Date.now() / 1000);
    session = roleIsValid && isNotExpired ? parsed : null;
  } catch {
    session = null;
  }

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      role: session.role,
      email: session.email,
      displayName: session.displayName,
    },
  });
}
