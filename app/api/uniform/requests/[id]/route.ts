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
      stockItem: { select: { name: true } },
      delivery: { include: { store: { select: { name: true } } } },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { stockItem, delivery, ...rest } = request;
  return NextResponse.json({
    ...rest,
    storeName: delivery?.store?.name ?? null,
    items: [
      {
        id: request.id,
        uniformType: stockItem?.name ?? request.ean,
        size: "",
        quantity: request.quantity,
        remarks: request.notes ?? null,
      },
    ],
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = (await req.json()) as { status?: string; notes?: string };
  const isTransitioningToCollected = body.status === "COLLECTED";

  if (isTransitioningToCollected) {
    const request = await prisma.uniformRequest.findUnique({
      where: { id },
      select: { quantity: true, requestedBy: true, status: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.uniformRequest.update({
      where: { id },
      data: { status: "COLLECTED" },
      include: {
        staff: { select: { displayName: true, role: true } },
        stockItem: { select: { name: true } },
        delivery: { include: { store: { select: { name: true } } } },
      },
    });

    const { stockItem: si1, delivery: d1, ...rest1 } = updated;
    return NextResponse.json({
      ...rest1,
      storeName: d1?.store?.name ?? null,
      items: [
        {
          id: updated.id,
          uniformType: si1?.name ?? updated.ean,
          size: "",
          quantity: updated.quantity,
          remarks: updated.notes ?? null,
        },
      ],
    });
  }

  const updated = await prisma.uniformRequest.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status as never }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      staff: { select: { displayName: true, role: true } },
      stockItem: { select: { name: true } },
      delivery: { include: { store: { select: { name: true } } } },
    },
  });

  const { stockItem: si2, delivery: d2, ...rest2 } = updated;
  return NextResponse.json({
    ...rest2,
    storeName: d2?.store?.name ?? null,
    items: [
      {
        id: updated.id,
        uniformType: si2?.name ?? updated.ean,
        size: "",
        quantity: updated.quantity,
        remarks: updated.notes ?? null,
      },
    ],
  });
}
