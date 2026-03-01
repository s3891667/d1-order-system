import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  let body: { ean?: string; name?: string };
  try {
    body = (await req.json()) as { ean?: string; name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ean = typeof body.ean === "string" ? body.ean.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!ean || !name) {
    return NextResponse.json(
      { error: "ean and name are required" },
      { status: 400 }
    );
  }

  try {
    await prisma.stockItem.delete({
      where: { ean_name: { ean, name } },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot remove: item is referenced by existing requests" },
        { status: 409 }
      );
    }
    if (prismaErr.code === "P2025") {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }
    throw err;
  }
}
