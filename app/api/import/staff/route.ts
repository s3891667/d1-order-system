import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFieldValue, normalizeForKey, parseCsvRecords, type ParsedRow } from "@/utils/importCsv";
import type { StaffRole } from "@/generated/prisma/enums";

type InvalidRow = { rowNumber: number; errors: string[]; row: ParsedRow };
const DUPLICATE_STAFF_ERROR = "Staff name already exists in the database.";
type ValidStaffRow = {
  rowNumber: number;
  displayName: string;
  role: StaffRole;
  storeName: string;
  uniformLimit: number | null;
  rawRow: ParsedRow;
};

const parseRole = (value: string): StaffRole | null => {
  const normalized = normalizeForKey(value).toUpperCase();
  if (normalized === "STAFF" || normalized === "MANAGER" || normalized === "CASUAL") {
    return normalized;
  }
  return null;
};

const parseUniformLimit = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const buildErrorResponse = (message: string, status = 400) =>
  NextResponse.json(
    {
      importType: "staff",
      summary: {
        importType: "staff",
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
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return buildErrorResponse("Please upload a CSV file");
  }

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
    const validRows: ValidStaffRow[] = [];

    for (const [index, rawRow] of records.entries()) {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      const displayName = getFieldValue(rawRow, ["display name", "display_name", "name", "staff name"]);
      const roleRaw = getFieldValue(rawRow, ["role"]);
      const storeName = getFieldValue(rawRow, ["store", "store name"]);
      const uniformLimitRaw = getFieldValue(rawRow, ["uniform limit", "uniform_limit", "limit"]);

      //if (!displayName) rowErrors.push("Missing Display Name");
      //if (!storeName) rowErrors.push("Missing Store");
      if (!displayName || !storeName) {

      }

      const role = roleRaw ? parseRole(roleRaw) : null;
      const parsedUniformLimit = uniformLimitRaw ? parseUniformLimit(uniformLimitRaw) : null;
      //if (!roleRaw) rowErrors.push("Missing Role");
      if (!roleRaw || (!displayName && !storeName)) {
        rowErrors.push("Please check format of your file")
      }
      else if (!role) rowErrors.push("Role must be one of: STAFF, MANAGER, CASUAL");
      if (uniformLimitRaw && parsedUniformLimit === null) {
        rowErrors.push("Uniform limit must be a positive integer");
      }

      if (rowErrors.length > 0) {
        invalidRows.push({ rowNumber, errors: rowErrors, row: rawRow });
        continue;
      }

      validRows.push({
        rowNumber,
        displayName,
        role: role as StaffRole,
        storeName,
        uniformLimit: parsedUniformLimit,
        rawRow,
      });
    }

    const existingStores = await prisma.store.findMany({
      select: { id: true, name: true },
    });
    const storeByNameKey = new Map(
      existingStores.map((store) => [normalizeForKey(store.name), { id: store.id, name: store.name }])
    );
    const existingStaffNamesByStoreId = new Map<number, Set<string>>();

    let success = 0;
    let skipped = 0;

    for (const row of validRows) {
      try {
        const storeKey = normalizeForKey(row.storeName);
        let store = storeByNameKey.get(storeKey);
        if (!store) {
          const createdStore = await prisma.store.create({ data: { name: row.storeName.trim() } });
          store = { id: createdStore.id, name: createdStore.name };
          storeByNameKey.set(storeKey, store);
        }

        let existingStaffNameKeys = existingStaffNamesByStoreId.get(store.id);
        if (!existingStaffNameKeys) {
          const existingStaff = await prisma.staff.findMany({
            where: { storeId: store.id },
            select: { displayName: true },
          });
          existingStaffNameKeys = new Set(existingStaff.map((staff) => normalizeForKey(staff.displayName)));
          existingStaffNamesByStoreId.set(store.id, existingStaffNameKeys);
        }

        const staffNameKey = normalizeForKey(row.displayName);
        if (existingStaffNameKeys.has(staffNameKey)) {
          skipped++;
          invalidRows.push({
            rowNumber: row.rowNumber,
            errors: [DUPLICATE_STAFF_ERROR],
            row: row.rawRow,
          });
          continue;
        }

        await prisma.staff.create({
          data: {
            displayName: row.displayName,
            role: row.role,
            storeId: store.id,
            uniformLimit: row.uniformLimit,
          } as never,
        });
        existingStaffNameKeys.add(staffNameKey);
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
    const failed = invalidRows.length;
    const errorCounts = new Map<string, number>();
    for (const invalidRow of invalidRows) {
      for (const error of invalidRow.errors) {
        errorCounts.set(error, (errorCounts.get(error) ?? 0) + 1);
      }
    }
    const summarizedErrors = Array.from(errorCounts.entries()).map(([error, count]) =>
      count > 1 ? `${error} (${count} rows)` : error
    );
    return NextResponse.json({
      importType: "staff",
      summary: {
        importType: "staff",
        fileName: file.name,
        processedAt: new Date().toISOString(),
        total: records.length,
        valid,
        success,
        skipped,
        failed,
      },
      invalidRows,
      errors: summarizedErrors,
      notices: [],
    });
  } catch {
    return buildErrorResponse("Staff import failed unexpectedly.");
  }

}




