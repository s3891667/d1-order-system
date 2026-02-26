import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()

  const record = await prisma.uniformRequest.create({
    data: body,
  })

  return NextResponse.json(record)
}

export async function GET() {
  const records = await prisma.uniformRequest.findMany()
  return NextResponse.json(records)
}
