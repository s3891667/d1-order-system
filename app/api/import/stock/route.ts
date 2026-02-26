import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getFieldValue, normalizeForKey, parseCsvRecords, type ParsedRow } from "@/utils/importCsv";

type InvalidRow = { rowNumber: number; errors: string[]; row: ParsedRow };
type ValidStockRow = {
  rowNumber: number;
  id: number | null;
  ean: string;
  name: string;
  qty: number;
  rawRow: ParsedRow;
};

const buildStockKey = (ean: string) => normalizeForKey(ean);
const isNumericEan = (value: string) => /^\d+$/.test(value.trim());

const findNextAvailableId = (requestedId: number, usedIds: Set<number>) => {
  let candidate = requestedId;
  while (usedIds.has(candidate)) candidate += 1;
  return candidate;
};

const findNextAvailableEan = (requestedEan: string, usedEanKeys: Set<string>) => {
  const requested = requestedEan.trim();
  if (!usedEanKeys.has(buildStockKey(requested))) return requested;

  const width = requested.length;
  let counter = BigInt(requested);
  let candidate = requested;
  do {
    counter += BigInt(1);
    const next = counter.toString();
    candidate = next.length < width ? next.padStart(width, "0") : next;
  } while (usedEanKeys.has(buildStockKey(candidate)));
  return candidate;
};

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
    const notices: string[] = [];
    const validRows: ValidStockRow[] = [];

    // --- Step 1: Validate rows ---
    for (const [index, rawRow] of records.entries()) {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      const ean = getFieldValue(rawRow, ["ean", "EAN"]);
      const name = getFieldValue(rawRow, ["name", "Name"]);
      const qtyRaw = getFieldValue(rawRow, ["qty", "Qty", "quantity"]);
      const idRaw = getFieldValue(rawRow, ["id", "ID"]);

      if (!ean) rowErrors.push("Missing EAN");
      else if (!isNumericEan(ean)) rowErrors.push("EAN must contain digits only");
      if (!name) rowErrors.push("Missing Name");

      let qty = 0;
      if (!qtyRaw) rowErrors.push("Missing Qty");
      else {
        qty = Number(qtyRaw);
        if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 0)
          rowErrors.push("Qty must be a non-negative integer");
      }

      let parsedId: number | null = null;
      if (idRaw) {
        const id = Number(idRaw);
        if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0)
          rowErrors.push("ID must be a positive integer");
        else parsedId = id;
      }

      if (rowErrors.length > 0) {
        invalidRows.push({ rowNumber, errors: rowErrors, row: rawRow });
        continue;
      }

      validRows.push({ rowNumber, id: parsedId, ean, name, qty, rawRow });
    }

    // --- Step 2: Fetch existing stock and track used IDs/EANs ---
    const existingRows = await prisma.stockItem.findMany({
      select: { id: true, ean: true, name: true },
    });

    const existingStockKeys = new Set(existingRows.map((item) => buildStockKey(item.ean)));
    const existingNameKeys = new Set(existingRows.map((item) => normalizeForKey(item.name)));
    const usedStockIds = new Set(existingRows.map((item) => item.id));
    let nextGeneratedId = usedStockIds.size > 0 ? Math.max(...usedStockIds) + 1 : 1;

    // --- Step 3: Insert valid rows ---
    let success = 0;
    let skipped = 0;

    for (const row of validRows) {
      try {
        const nameKey = normalizeForKey(row.name);
        if (existingNameKeys.has(nameKey)) {
          skipped++;
          invalidRows.push({ rowNumber: row.rowNumber, errors: ["Item name already exists."], row: row.rawRow });
          continue;
        }

        const resolvedEan = findNextAvailableEan(row.ean, existingStockKeys);
        if (resolvedEan !== row.ean)
          notices.push(`Row ${row.rowNumber}: EAN ${row.ean} was duplicated. Saved as ${resolvedEan}.`);

        const resolvedId = row.id ? findNextAvailableId(row.id, usedStockIds) : findNextAvailableId(nextGeneratedId, usedStockIds);
        if (!row.id) nextGeneratedId = resolvedId + 1;
        if (row.id && resolvedId !== row.id)
          notices.push(`Row ${row.rowNumber}: ID ${row.id} was duplicated. Saved as ${resolvedId}.`);

        await prisma.stockItem.create({
          data: { id: resolvedId, ean: resolvedEan, name: row.name, qty: row.qty },
        });

        existingStockKeys.add(buildStockKey(resolvedEan));
        existingNameKeys.add(nameKey);
        usedStockIds.add(resolvedId);
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
      errors: notices,
      notices,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return buildErrorResponse(`Stock import failed unexpectedly. ${message}`);
  }
}
