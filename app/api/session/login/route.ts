import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "d1_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
type AppRole = "admin" | "dispatchAdmin";

type LoginBody = {
  email?: string;
  password?: string;
  role?: AppRole;
};

type SessionUser = {
  role: AppRole;
  email: string;
  displayName: string;
};

function getAuthUser(role: AppRole): SessionUser & { password: string } {
  if (role === "admin") {
    return {
      role,
      email: process.env.ADMIN_EMAIL ?? "admin@123",
      password: process.env.ADMIN_PASSWORD ?? "123",
      displayName: process.env.ADMIN_DISPLAY_NAME ?? "Admin",
    };
  }

  return {
    role,
    email: process.env.DISPATCH_ADMIN_EMAIL ?? "dispatchAdmin@123",
    password: process.env.DISPATCH_ADMIN_PASSWORD ?? "123",
    displayName: process.env.DISPATCH_ADMIN_DISPLAY_NAME ?? "Dispatch Admin",
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LoginBody | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";
  const role = body?.role;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (role && role !== "admin" && role !== "dispatchAdmin") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const authUsers = [getAuthUser("admin"), getAuthUser("dispatchAdmin")];
  const authUser = authUsers.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password
  );
  if (!authUser) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const user: SessionUser = {
    role: authUser.role,
    email: authUser.email,
    displayName: authUser.displayName,
  };

  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const token = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const response = NextResponse.json({ user });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
