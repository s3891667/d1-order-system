"use client"

import { useState } from "react"

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [summary, setSummary] = useState<{ total: number; success: number; failed: number } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setSummary(null)
      setErrors([])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/import", { method: "POST", body: formData })
      const data = await res.json()

      setSummary({
        total: data.total,
        success: data.success,
        failed: data.failed,
      })
      setErrors(data.errors || [])
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Import Staff / Uniform Data</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {summary && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Import Summary</h2>
          <p>Total Rows: {summary.total}</p>
          <p>Successful: {summary.success}</p>
          <p>Failed: {summary.failed}</p>

          {errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-1 text-red-600">Errors:</h3>
              <ul className="list-disc list-inside text-red-500">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
