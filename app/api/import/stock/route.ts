import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getFieldValue, normalizeForKey, parseCsvRecords, type ParsedRow } from "@/utils/importCsv";

type InvalidRow = { rowNumber: number; errors: string[]; row: ParsedRow };
type ValidStockRow = {
  rowNumber: number;
  ean: string;
  name: string;
  qty: number;
  rawRow: ParsedRow;
};

const isNumericEan = (value: string) => /^\d+$/.test(value.trim());
const compositeKey = (ean: string, name: string) => normalizeForKey(ean) + "|" + normalizeForKey(name);

const buildErrorResponse = (message: string, status = 400) =>
  NextResponse.json(
    {
      importType: "stock",
      summary: {
        importType: "stock",
        fileName: null,
        processedAt: new Date().toISOString(),
        total: 0,
        valid: 0,
        success: 0,
        skipped: 0,
        failed: 0,
      },
      invalidRows: [],
      errors: [message],
    },
    { status }
  );

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return buildErrorResponse("No file uploaded");
  if (!file.name.toLowerCase().endsWith(".csv"))
    return buildErrorResponse("Please upload a CSV file");

  try {
    const text = await file.text();
    let records: ParsedRow[] = [];
    try {
      records = parseCsvRecords(text);
    } catch (error) {
      const parseError = error instanceof Error ? error.message : "Unknown CSV parser error";
      return buildErrorResponse(`Unable to parse CSV. ${parseError}`);
    }

    const invalidRows: InvalidRow[] = [];
    const validRows: ValidStockRow[] = [];

    // --- Step 1: Validate rows ---
    for (const [index, rawRow] of records.entries()) {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      const ean = getFieldValue(rawRow, ["ean", "EAN"]);
      const nameRaw = getFieldValue(rawRow, ["name", "Name"]);
      const qtyRaw = getFieldValue(rawRow, ["qty", "Qty", "quantity"]);

      if (!ean) rowErrors.push("Missing EAN");
      else if (!isNumericEan(ean)) rowErrors.push("EAN must contain digits only");
      if (!nameRaw) rowErrors.push("Missing Name");

      let qty = 0;
      if (!qtyRaw) rowErrors.push("Missing Qty");
      else {
        qty = Number(qtyRaw);
        if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 0)
          rowErrors.push("Qty must be a non-negative integer");
      }

      if (rowErrors.length > 0) {
        invalidRows.push({ rowNumber, errors: rowErrors, row: rawRow });
        continue;
      }

      validRows.push({ rowNumber, ean, name: nameRaw!.trim(), qty, rawRow });
    }

    // --- Step 2: Fetch existing stock and build composite key set ---
    const existingRows = await prisma.stockItem.findMany({
      select: { ean: true, name: true },
    });

    const existingKeys = new Set(existingRows.map((item) => compositeKey(item.ean, item.name)));

    // --- Step 3: Insert valid rows ---
    let success = 0;
    let skipped = 0;

    for (const row of validRows) {
      try {
        const key = compositeKey(row.ean, row.name);
        if (existingKeys.has(key)) {
          skipped++;
          invalidRows.push({ rowNumber: row.rowNumber, errors: ["Item already exists."], row: row.rawRow });
          continue;
        }

        await prisma.stockItem.create({
          data: { ean: row.ean, name: row.name, qty: row.qty },
        });

        existingKeys.add(key);
        success++;
      } catch {
        invalidRows.push({ rowNumber: row.rowNumber, errors: ["Database save failed for this row"], row: row.rawRow });
      }
    }

    const valid = validRows.length;
    const failed = invalidRows.length;

    return NextResponse.json({
      importType: "stock",
      summary: { importType: "stock", fileName: file.name, processedAt: new Date().toISOString(), total: records.length, valid, success, skipped, failed },
      invalidRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return buildErrorResponse(`Stock import failed unexpectedly. ${message}`);
  }
}
