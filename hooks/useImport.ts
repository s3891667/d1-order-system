"use client";

import { useState } from "react";
import type { ImportSummary, ImportType, InvalidRow } from "@/components/Import/types";

export function useImport() {
  const [importType, setImportType] = useState<ImportType>("staff");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setSummary(null);
      setErrors([]);
      setInvalidRows([]);
    }
  };

  const handleImportTypeChange = (type: ImportType) => {
    setImportType(type);
    setFile(null);
    setSummary(null);
    setErrors([]);
    setInvalidRows([]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const endpoint = importType === "staff" ? "/api/import/staff" : "/api/import/stock";

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data?.errors as string[] | undefined)?.[0] || "Upload failed");
      }
      setSummary(data.summary);
      setErrors(data.errors || []);
      setInvalidRows(data.invalidRows || []);
    } catch (err) {
      console.error(err);
      setSummary(null);
      setInvalidRows([]);
      setErrors([err instanceof Error ? err.message : "Upload failed"]);
    } finally {
      setLoading(false);
    }
  };

  return {
    importType,
    setImportType,
    file,
    summary,
    errors,
    invalidRows,
    loading,
    handleFileChange,
    handleImportTypeChange,
    handleUpload,
  };
}
