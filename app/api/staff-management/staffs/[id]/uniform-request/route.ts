import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { LOW_STOCK_THRESHOLD, UNIFORM_REQUEST_COOLDOWN_HOURS } from "@/utils/uniformRequestPolicy"
import { generateTrackingId } from "@/utils/batchCodeGeneration"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

const MAX_TRACKING_RETRIES = 5

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params
  const requestedBy = Number(id)

  if (!Number.isInteger(requestedBy) || requestedBy <= 0) {
    return NextResponse.json({ error: "Invalid staff id" }, { status: 400 })
  }

  const body = await req.json() as Partial<Prisma.UniformRequestUncheckedCreateInput> & {
    uniformItem?: string
    quantity?: number
  }
  const payload: Pick<Prisma.UniformRequestUncheckedCreateInput, "status" | "notes"> = {}
  const uniformItem = typeof body.uniformItem === "string" ? body.uniformItem.trim() : ""
  const quantity = Number(body.quantity)

  if (body.status) {
    payload.status = body.status
  }

  if (typeof body.notes === "string") {
    payload.notes = body.notes
  }

  if (!uniformItem) {
    return NextResponse.json({ error: "Uniform item is required." }, { status: 400 })
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Quantity must be a positive integer." }, { status: 400 })
  }

  const cooldownWindowMs = UNIFORM_REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000
  const now = new Date()

  for (let attempt = 0; attempt < MAX_TRACKING_RETRIES; attempt += 1) {
    const trackingId = generateTrackingId(requestedBy)

    try {
      const result = await prisma.$transaction(async (tx) => {
        const staff = await tx.staff.findUnique({
          where: { id: requestedBy },
          select: { uniformLimit: true } as never,
        }) as { uniformLimit: number | null } | null

        if (!staff) {
          return { outcome: "staff_not_found" as const }
        }

        if (typeof staff.uniformLimit === "number" && quantity > staff.uniformLimit) {
          return {
            outcome: "uniform_limit_error" as const,
            uniformLimit: staff.uniformLimit,
          }
        }

        const previousRequest = await tx.uniformRequest.findFirst({
          where: { requestedBy },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        })

        if (previousRequest) {
          const nextAllowedAt = new Date(previousRequest.createdAt.getTime() + cooldownWindowMs)
          if (now < nextAllowedAt) {
            return {
              outcome: "cooldown" as const,
              nextAllowedAt,
            }
          }
        }

        const stockUpdate = await tx.stockItem.updateMany({
          where: {
            ean: uniformItem,
            qty: { gte: quantity },
          },
          data: {
            qty: { decrement: quantity },
          },
        })

        if (stockUpdate.count === 0) {
          const stock = await tx.stockItem.findUnique({
            where: { ean: uniformItem },
            select: { qty: true },
          })

          return {
            outcome: "stock_error" as const,
            available: stock?.qty ?? 0,
          }
        }

        const remainingStock = await tx.stockItem.findUnique({
          where: { ean: uniformItem },
          select: { qty: true },
        })

        const record = await tx.uniformRequest.create({
          data: {
            ...payload,
            requestedBy,
            requestNo: trackingId,
            trackingId,
          },
        })

        return {
          outcome: "success" as const,
          record,
          remainingStock: remainingStock?.qty ?? 0,
        }
      })

      if (result.outcome === "cooldown") {
        return NextResponse.json(
          {
            error: "You cannot request another uniform yet due to cooldown.",
            cooldownHours: UNIFORM_REQUEST_COOLDOWN_HOURS,
            nextAllowedAt: result.nextAllowedAt.toISOString(),
          },
          { status: 429 },
        )
      }

      if (result.outcome === "stock_error") {
        return NextResponse.json(
          {
            error: "Requested quantity exceeds available stock.",
            availableStock: result.available,
          },
          { status: 409 },
        )
      }

      if (result.outcome === "uniform_limit_error") {
        return NextResponse.json(
          {
            error: "Requested quantity exceeds staff uniform limit.",
            uniformLimit: result.uniformLimit,
          },
          { status: 409 },
        )
      }

      if (result.outcome === "staff_not_found") {
        return NextResponse.json(
          { error: "Staff member not found." },
          { status: 404 },
        )
      }

      return NextResponse.json({
        ...result.record,
        requestedItem: uniformItem,
        requestedQuantity: quantity,
        remainingStock: result.remainingStock,
        isLowStock: result.remainingStock <= LOW_STOCK_THRESHOLD,
      })
    } catch (error) {
      const isUniqueRequestNoError =
        error instanceof Error &&
        error.message.includes("Unique constraint failed") &&
        (error.message.includes("requestNo") || error.message.includes("trackingId"))

      if (!isUniqueRequestNoError || attempt === MAX_TRACKING_RETRIES - 1) {
        throw error
      }
    }
  }

  return NextResponse.json(
    { error: "Unable to generate unique request tracking number." },
    { status: 500 },
  )
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
