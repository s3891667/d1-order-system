import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const staffId = Number(id);

  if (!Number.isInteger(staffId) || staffId <= 0) {
    return NextResponse.json({ error: "Invalid staff ID." }, { status: 400 });
  }

  const body = (await req.json()) as { requestId?: number };
  const requestId = Number(body.requestId);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }

  try {
    const request = await prisma.uniformRequest.findUnique({
      where: { id: requestId },
      select: { id: true, requestedBy: true, status: true, quantity: true, ean: true, stockItemName: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Uniform request not found." }, { status: 404 });
    }

    if (request.requestedBy !== staffId) {
      return NextResponse.json(
        { error: "This request does not belong to the specified staff member." },
        { status: 403 },
      );
    }

    if (request.status !== "REQUEST") {
      return NextResponse.json(
        {
          error: `Only requests in REQUEST status can be cancelled. Current status: "${request.status}".`,
          currentStatus: request.status,
        },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.uniformRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      }),
      prisma.stockItem.update({
        where: { ean_name: { ean: request.ean, name: request.stockItemName } },
        data: { qty: { increment: request.quantity } },
      }),
    ]);

    const cancelled = await prisma.uniformRequest.findUnique({
      where: { id: requestId },
      include: {
        staff: { select: { displayName: true, role: true } },
        stockItem: { select: { name: true } },
      },
    });

    return NextResponse.json(cancelled);
  } catch (error) {
    console.error("Cancel uniform request error:", error);
    return NextResponse.json({ error: "Failed to cancel request." }, { status: 500 });
  }
}
