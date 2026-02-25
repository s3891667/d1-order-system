import { NextResponse } from "next/server"
import * as csv from "csv-parse/sync"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ total: 0, success: 0, failed: 0, errors: ["No file uploaded"] }, { status: 400 })
  }

  const text = await file.text()
  const records = csv.parse(text, { columns: true, skip_empty_lines: true })

  let total = records.length
  let success = 0
  let failed = 0
  let errors: string[] = []

  for (const [i, row] of records.entries()) {
    if (!row.name) {
      failed++
      errors.push(`Row ${i + 1}: Missing name`)
    } else {
      success++
      // TODO: save row to DB using Prisma + SQLite
    }
  }

  return NextResponse.json({ total, success, failed, errors })
}
