import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFieldValue, normalizeForKey, parseCsvRecords, type ParsedRow } from "@/utils/importCsv";

type InvalidRow = { rowNumber: number; errors: string[]; row: ParsedRow };
type StaffRoleValue = "STAFF" | "MANAGER" | "CASUAL";
type ValidStaffRow = {
  rowNumber: number;
  displayName: string;
  role: StaffRoleValue;
  storeName: string;
  rawRow: ParsedRow;
};

const parseRole = (value: string): StaffRoleValue | null => {
  const normalized = normalizeForKey(value).toUpperCase();
  if (normalized === "STAFF" || normalized === "MANAGER" || normalized === "CASUAL") {
    return normalized;
  }
  return null;
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

      if (!displayName) rowErrors.push("Missing Display Name");
      if (!storeName) rowErrors.push("Missing Store");

      const role = roleRaw ? parseRole(roleRaw) : null;
      if (!roleRaw) rowErrors.push("Missing Role");
      else if (!role) rowErrors.push("Role must be one of: STAFF, MANAGER, CASUAL");

      if (rowErrors.length > 0) {
        invalidRows.push({ rowNumber, errors: rowErrors, row: rawRow });
        continue;
      }

      validRows.push({
        rowNumber,
        displayName,
        role: role as StaffRoleValue,
        storeName,
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
            select: { staffName: true },
          });
          existingStaffNameKeys = new Set(existingStaff.map((staff) => normalizeForKey(staff.staffName)));
          existingStaffNamesByStoreId.set(store.id, existingStaffNameKeys);
        }

        const staffNameKey = normalizeForKey(row.displayName);
        if (existingStaffNameKeys.has(staffNameKey)) {
          skipped++;
          invalidRows.push({
            rowNumber: row.rowNumber,
            errors: ["Staff already exists in this store."],
            row: row.rawRow,
          });
          continue;
        }

        await prisma.staff.create({
          data: {
            staffName: row.displayName,
            role: row.role,
            storeId: store.id,
          },
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




