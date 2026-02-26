import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params
  const requestedBy = Number(id)

  if (!Number.isInteger(requestedBy) || requestedBy <= 0) {
    return NextResponse.json({ error: "Invalid staff id" }, { status: 400 })
  }

  const body = await req.json()

  const record = await prisma.uniformRequest.create({
    data: {
      ...body,
      requestedBy,
    },
  })

  return NextResponse.json(record)
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params
  const requestedBy = Number(id)

  if (!Number.isInteger(requestedBy) || requestedBy <= 0) {
    return NextResponse.json({ error: "Invalid staff id" }, { status: 400 })
  }

  const records = await prisma.uniformRequest.findMany({
    where: { requestedBy },
  })

  return NextResponse.json(records)
}
