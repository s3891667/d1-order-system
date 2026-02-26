import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.$queryRaw<
      Array<{
        id: number;
        displayName: string;
        role: string;
        uniformLimit: number | null;
      }>
    >`SELECT id, displayName, role, uniformLimit FROM Staff ORDER BY displayName ASC`;

    return NextResponse.json(
      staff.map((member) => ({
        id: Number(member.id),
        displayName: member.displayName,
        role: member.role,
        uniformLimit: Number.isInteger(member.uniformLimit) && Number(member.uniformLimit) > 0
          ? Number(member.uniformLimit)
          : null,
      })),
    );
  } catch (error) {
    console.error("Failed to load staff list:", error);
    return NextResponse.json({ error: "Failed to load staff list" }, { status: 500 });
  }
}
