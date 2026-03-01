import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UNIFORM_REQUEST_COOLDOWN_HOURS } from "@/utils/uniformRequestPolicy"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params
  const requestedBy = Number(id)

  if (!Number.isInteger(requestedBy) || requestedBy <= 0) {
    return NextResponse.json({ error: "Invalid staff id" }, { status: 400 })
  }

  const [latestRequest, staff, ordersResult] = await Promise.all([
    prisma.uniformRequest.findFirst({
      where: { requestedBy },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.staff.findUnique({
      where: { id: requestedBy },
      select: { uniformLimit: true },
    }),
    prisma.uniformRequest.aggregate({
      where: {
        requestedBy,
        status: { not: "CANCELLED" },
      },
      _sum: { quantity: true },
      _count: { id: true },
    }),
  ])

  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
  }

  const totalOrdered = ordersResult._sum.quantity ?? 0
  const totalRequests = ordersResult._count.id
  const remaining =
    typeof staff.uniformLimit === "number"
      ? Math.max(0, staff.uniformLimit - totalOrdered)
      : null

  if (!latestRequest) {
    return NextResponse.json({
      canRequest: true,
      cooldownHours: UNIFORM_REQUEST_COOLDOWN_HOURS,
      lastRequestedAt: null,
      nextAllowedAt: null,
      uniformLimit: staff.uniformLimit,
      totalOrdered,
      totalRequests,
      remaining,
    })
  }

  const cooldownWindowMs = UNIFORM_REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000
  const nextAllowedAt = new Date(latestRequest.createdAt.getTime() + cooldownWindowMs)
  const canRequest = Date.now() >= nextAllowedAt.getTime()

  return NextResponse.json({
    canRequest,
    cooldownHours: UNIFORM_REQUEST_COOLDOWN_HOURS,
    lastRequestedAt: latestRequest.createdAt.toISOString(),
    nextAllowedAt: canRequest ? null : nextAllowedAt.toISOString(),
    uniformLimit: staff.uniformLimit,
    totalOrdered,
    totalRequests,
    remaining,
  })
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const requestedBy = Number(id)

  if (!Number.isInteger(requestedBy) || requestedBy <= 0) {
    return NextResponse.json({ error: "Invalid staff id" }, { status: 400 })
  }

  const body = (await req.json()) as { uniformLimit?: unknown }
  const rawLimit = body.uniformLimit
  let uniformLimit: number | null

  if (rawLimit === null) {
    uniformLimit = null
  } else {
    uniformLimit = Number(rawLimit)
    if (!Number.isInteger(uniformLimit) || uniformLimit <= 0) {
      return NextResponse.json({ error: "Uniform limit must be null or a positive integer." }, { status: 400 })
    }
  }

  try {
    const staff = await prisma.staff.update({
      where: { id: requestedBy },
      data: { uniformLimit },
      select: { id: true, uniformLimit: true },
    })

    return NextResponse.json(staff)
  } catch {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
  }
}
