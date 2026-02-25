import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      errors: ["Use /api/import/staff or /api/import/stock for imports."],
    },
    { status: 400 }
  );
}
