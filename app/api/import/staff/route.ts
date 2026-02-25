import { NextResponse } from "next/server";
import * as csv from "csv-parse/sync";
import { prisma } from "@/lib/prisma";

type ParsedRow = Record<string, string | undefined>;
type InvalidRow = { rowNumber: number; errors: string[]; row: ParsedRow };
type StaffRoleValue = "STAFF" | "MANAGER" | "CASUAL";
type ImportDbClient = {
  store: {
    findMany: (args: { select: { id: true; name: true } }) => Promise<Array<{ id: number; name: string }>>;
    create: (args: { data: { name: string } }) => Promise<{ id: number; name: string }>;
  };
  staff: {
    findMany: (args: {
      where: { storeId: number };
      select: { displayName: true };
    }) => Promise<Array<{ displayName: string }>>;
    create: (args: {
      data: { displayName: string; role: StaffRoleValue; storeId: number };
    }) => Promise<unknown>;
  };
};
type ValidStaffRow = {
  rowNumber: number;
  displayName: string;
  role: StaffRoleValue;
  store: string;
  rawRow: ParsedRow;
};

const allowedRoles = new Set(["staff", "manager", "casual"]);
const roleMap: Record<string, StaffRoleValue> = {
  staff: "STAFF",
  manager: "MANAGER",
  casual: "CASUAL",
};
const DISPLAY_NAME_KEYS = ["displayName", "display_name", "Display Name", "name"];
const STORE_KEYS = ["store", "Store", "storeName", "store_name"];
const ROLE_KEYS = ["role", "Role"];

const normalizeValue = (value: string | undefined) => (value ?? "").trim();
const normalizeForKey = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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
    const records = csv.parse(text, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    }) as ParsedRow[];

    const invalidRows: InvalidRow[] = [];
    const validRows: ValidStaffRow[] = [];
    const seenStaffKeys = new Set<string>();

    for (const [index, rawRow] of records.entries()) {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];

      const displayName = getFieldValue(rawRow, DISPLAY_NAME_KEYS);
      const store = getFieldValue(rawRow, STORE_KEYS);
      const role = getFieldValue(rawRow, ROLE_KEYS).toLowerCase();

      if (!displayName) rowErrors.push("Missing Display Name");
      if (!store) rowErrors.push("Missing store");
      if (!role) {
        rowErrors.push("Missing role");
      } else if (!allowedRoles.has(role)) {
        rowErrors.push("Role must be staff, manager, or casual");
      }

      // Duplicate in the same file is based on staff name + store.
      const duplicateKey =
        displayName && store ? `${normalizeForKey(displayName)}|${normalizeForKey(store)}` : "";
      if (duplicateKey && seenStaffKeys.has(duplicateKey)) {
        rowErrors.push("Duplicate staff name in same store (file)");
      }

      if (rowErrors.length > 0) {
        invalidRows.push({ rowNumber, errors: rowErrors, row: rawRow });
        continue;
      }

      validRows.push({
        rowNumber,
        displayName,
        role: roleMap[role],
        store,
        rawRow,
      });
      if (duplicateKey) seenStaffKeys.add(duplicateKey);
    }

    let success = 0;
    let skipped = 0;
    const db = prisma as unknown as ImportDbClient;
    const storeRows = await db.store.findMany({ select: { id: true, name: true } });
    const storeIdByNormalizedName = new Map<string, number>();
    for (const store of storeRows) {
      storeIdByNormalizedName.set(normalizeForKey(store.name), store.id);
    }
    const storeStaffCache = new Map<number, Set<string>>();
    for (const row of validRows) {
      try {
        const normalizedStore = normalizeForKey(row.store);
        let storeId = storeIdByNormalizedName.get(normalizedStore);
        if (!storeId) {
          const createdStore = await db.store.create({ data: { name: row.store.trim() } });
          storeId = createdStore.id;
          storeIdByNormalizedName.set(normalizedStore, storeId);
        }

        let existingKeys = storeStaffCache.get(storeId);
        if (!existingKeys) {
          const existingRows = await db.staff.findMany({
            where: { storeId },
            select: { displayName: true },
          });
          existingKeys = new Set(existingRows.map((staff) => normalizeForKey(staff.displayName)));
          storeStaffCache.set(storeId, existingKeys);
        }

        // Duplicate in DB is based on staff name + store.
        const dbDuplicateKey = normalizeForKey(row.displayName);
        if (existingKeys.has(dbDuplicateKey)) {
          skipped++;
          invalidRows.push({
            rowNumber: row.rowNumber,
            errors: ["Duplicate staff name in same store (database)"],
            row: row.rawRow,
          });
          continue;
        }

        await db.staff.create({
          data: {
            displayName: row.displayName,
            role: row.role,
            storeId,
          },
        });
        existingKeys.add(dbDuplicateKey);
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
      errors: invalidRows.flatMap((entry) =>
        entry.errors.map((err) => `Row ${entry.rowNumber}: ${err}`)
      ),
    });
  } catch {
    return buildErrorResponse("Unable to parse CSV. Check the file format and headers.");
  }
}
