"use client";

import ImportForm from "@/components/Import/ImportForm";
import ImportSummaryDisplay from "@/components/Import/ImportSummaryDisplay";
import InvalidRowsDisplay from "@/components/Import/InvalidRowsDisplay";
import { useImport } from "@/hooks/useImport";

export default function ImportPage() {
  const {
    importType,
    file,
    summary,
    errors,
    invalidRows,
    loading,
    handleFileChange,
    handleImportTypeChange,
    handleUpload,
  } = useImport();

  return (
    <section className="w-full max-w-6xl rounded-lg border bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Import Data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload staff or stock CSV files to import data into the system.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <ImportForm
          importType={importType}
          onImportTypeChange={handleImportTypeChange}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          disabled={!file}
          loading={loading}
        />

        <div className="space-y-4">
          <ImportSummaryDisplay summary={summary} />

          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-4">
              <h4 className="mb-1 font-semibold text-red-600">Errors:</h4>
              <ul className="list-inside list-disc text-red-500">
                {errors.map((err, idx) => (
                  <li key={`${err}-${idx}`}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <InvalidRowsDisplay invalidRows={invalidRows} />
        </div>
      </div>
    </section>
  );
}
