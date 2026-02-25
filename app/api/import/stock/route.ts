import { NextResponse } from "next/server";
import * as csv from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

type ParsedRow = Record<string, string | undefined>;
type InvalidRow = { rowNumber: number; errors: string[]; row: ParsedRow };
type ValidStockRow = {
  rowNumber: number;
  ean: string;
  name: string;
  qty: number;
  rawRow: ParsedRow;
};
type ImportDbClient = {
  stockItem: {
    upsert: (args: {
      where: { ean_name: { ean: string; name: string } };
      update: { qty: number };
      create: { ean: string; name: string; qty: number };
    }) => Promise<unknown>;
  };
};

const normalizeValue = (value: string | undefined) => (value ?? "").trim();
const getFieldValue = (row: ParsedRow, keys: string[]) => {
  for (const key of keys) {
    const value = normalizeValue(row[key]);
    if (value) return value;
  }
  return "";
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
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return buildErrorResponse("Please upload a CSV file");
  }

  try {
    const text = await file.text();
    const records = csv.parse(text, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    }) as ParsedRow[];

    const invalidRows: InvalidRow[] = [];
    const validRows: ValidStockRow[] = [];
    const seenStockKeys = new Set<string>();

    for (const [index, rawRow] of records.entries()) {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      const ean = getFieldValue(rawRow, ["ean", "EAN"]);
      const name = getFieldValue(rawRow, ["name", "Name"]);
      const qtyRaw = getFieldValue(rawRow, ["qty", "Qty", "quantity"]);

      if (!ean) rowErrors.push("Missing EAN");
      if (!name) rowErrors.push("Missing Name");
      if (!qtyRaw) {
        rowErrors.push("Missing Qty");
      } else {
        const qty = Number(qtyRaw);
        if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 0) {
          rowErrors.push("Qty must be a non-negative integer");
        }
      }

      const stockKey = `${ean}|${name.toLowerCase()}`;
      if (ean && name && seenStockKeys.has(stockKey)) {
        rowErrors.push("Duplicate EAN+Name in file");
      }

      if (rowErrors.length > 0) {
        invalidRows.push({ rowNumber, errors: rowErrors, row: rawRow });
        continue;
      }

      validRows.push({
        rowNumber,
        ean,
        name,
        qty: Number(qtyRaw),
        rawRow,
      });
      seenStockKeys.add(stockKey);
    }

    const db = prisma as unknown as ImportDbClient;
    let success = 0;
    for (const row of validRows) {
      try {
        await db.stockItem.upsert({
          where: { ean_name: { ean: row.ean, name: row.name } },
          update: { qty: row.qty },
          create: { ean: row.ean, name: row.name, qty: row.qty },
        });
        success++;
      } catch {
        invalidRows.push({
          rowNumber: row.rowNumber,
          errors: ["Database save failed for this row"],
          row: row.rawRow,
        });
      }
    }

    const valid = validRows.length;
    const failed = records.length - success;
    return NextResponse.json({
      importType: "stock",
      summary: {
        importType: "stock",
        fileName: file.name,
        processedAt: new Date().toISOString(),
        total: records.length,
        valid,
        success,
        failed,
      },
      invalidRows,
      errors: invalidRows.flatMap((entry) =>
        entry.errors.map((err) => `Row ${entry.rowNumber}: ${err}`)
      ),
    });
  } catch {
    return buildErrorResponse("Unable to parse CSV. Check the file format and headers.");
  }
}
