import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const requests = await prisma.uniformRequest.findMany({
    select: {
      id: true,
      ean: true,
      trackingId: true,
      status: true,
      notes: true,
      createdAt: true,
      requestedBy: true,
      staff: {
        select: {
          displayName: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(requests);
}
