import * as csv from "csv-parse/sync";

export type ParsedRow = Record<string, string | undefined>;

export const normalizeValue = (value: string | undefined) => (value ?? "").trim();

export const normalizeForKey = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const getFieldValue = (row: ParsedRow, keys: string[]) => {
  const expectedKeys = new Set(keys.map((key) => normalizeForKey(key)));
  for (const [rawKey, rawValue] of Object.entries(row)) {
    if (!expectedKeys.has(normalizeForKey(rawKey))) continue;
    const value = normalizeValue(rawValue);
    if (value) return value;
  }
  return "";
};

export const parseCsvRecords = (text: string): ParsedRow[] => {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const parseWithDelimiter = (delimiter: "," | ";") =>
    csv.parse(text, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
      delimiter,
      relax_column_count: true,
    }) as ParsedRow[];

  const likelyDelimiter: "," | ";" =
    firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  try {
    return parseWithDelimiter(likelyDelimiter);
  } catch (error) {
    const fallbackDelimiter: "," | ";" = likelyDelimiter === "," ? ";" : ",";
    const canFallback =
      (likelyDelimiter === "," && firstLine.includes(";")) ||
      (likelyDelimiter === ";" && firstLine.includes(","));
    if (canFallback) return parseWithDelimiter(fallbackDelimiter);
    throw error;
  }
};
