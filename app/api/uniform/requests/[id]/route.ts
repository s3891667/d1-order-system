import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const request = await prisma.uniformRequest.findUnique({
    where: { id },
    include: {
      staff: { select: { displayName: true, role: true } },
      items: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(request);
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = (await req.json()) as { status?: string; notes?: string };

  const updated = await prisma.uniformRequest.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status as never }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      staff: { select: { displayName: true, role: true } },
      items: true,
    },
  });

  return NextResponse.json(updated);
}
