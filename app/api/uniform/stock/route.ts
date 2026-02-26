import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stockItems = await prisma.stockItem.findMany({
    select: {
      ean: true,
      name: true,
      qty: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(stockItems);
}
