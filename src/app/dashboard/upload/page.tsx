"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertTriangle, X, Loader2 } from "lucide-react";
import Papa from "papaparse";

interface UploadResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: { row: number; message: string }[];
}

export default function UploadPage() {
  const [dataType, setDataType] = useState("production");
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data as Record<string, string>[]);
      },
    });
  }

  async function handleUpload() {
    if (parsedData.length === 0) return;
    setUploading(true);
    setResult(null);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: dataType, data: parsedData }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Network error");
    }
    setUploading(false);
  }

  function reset() {
    setParsedData([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const templateCols: Record<string, string[]> = {
    production: ["mineId", "date", "coalGrade", "quantity", "shift", "productionCost"],
    dispatch: ["mineId", "date", "coalGrade", "quantity", "sector", "destination"],
    demand: ["date", "coalGrade", "quantity", "sector"],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6 text-amber-400" />
          Data Upload
        </h2>
        <p className="text-coal-400 text-sm mt-1">
          Import production, dispatch, or demand data from CSV files
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Upload Configuration</h3>

            <div className="mb-4">
              <label className="text-sm text-coal-400 block mb-2">Data Type</label>
              <div className="flex gap-2">
                {["production", "dispatch", "demand"].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setDataType(t); reset(); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                      dataType === t
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "text-coal-400 bg-coal-800 border border-coal-700 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="border-2 border-dashed border-coal-700 rounded-xl p-10 text-center hover:border-amber-500/50 transition cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="hidden"
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-amber-400" />
                  <div className="text-left">
                    <p className="font-medium">{fileName}</p>
                    <p className="text-coal-400 text-sm">{parsedData.length} rows detected</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} className="ml-4 text-coal-400 hover:text-red-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-coal-500 mx-auto mb-3" />
                  <p className="text-coal-300 font-medium">Drop CSV file or click to browse</p>
                  <p className="text-coal-500 text-sm mt-1">Max file size: 10MB</p>
                </>
              )}
            </div>

            {/* Preview */}
            {parsedData.length > 0 && !result && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-coal-300 mb-2">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-coal-500 border-b border-coal-800">
                        {Object.keys(parsedData[0]).map((col) => (
                          <th key={col} className="text-left py-2 px-2">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-coal-800/30">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="py-1.5 px-2 text-coal-300">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-coal-900 font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Importing..." : `Import ${parsedData.length} Records`}
                </button>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mt-4 space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-400">Import Complete</p>
                    <p className="text-sm text-coal-300">
                      ✓ {result.validRows} valid rows imported
                      {result.errorRows > 0 && <> • ⚠ {result.errorRows} rows with errors</>}
                    </p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Row Errors ({result.errorRows})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs text-coal-300">
                          Row {err.row}: {err.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={reset} className="text-sm text-amber-400 hover:underline">
                  Upload another file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Template Guide */}
        <div className="bg-coal-900 border border-coal-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">CSV Template</h3>
          <p className="text-coal-400 text-sm mb-3">
            Required columns for <span className="text-amber-400 capitalize">{dataType}</span> data:
          </p>
          <div className="space-y-2">
            {templateCols[dataType]?.map((col) => (
              <div key={col} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="font-mono text-coal-300">{col}</span>
                {["date", "coalGrade", "quantity", "mineId"].includes(col) && (
                  <span className="text-red-400 text-xs">*required</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-coal-800 rounded-lg">
            <p className="text-xs text-coal-500 mb-1">Example row:</p>
            <p className="text-xs font-mono text-coal-300">
              {dataType === "production" && "1,2024-01-15,G5,250.5,A,1200"}
              {dataType === "dispatch" && "1,2024-01-15,G5,220.0,Power,NTPC Kahalgaon"}
              {dataType === "demand" && "2024-01-15,G5,180.0,Power"}
            </p>
          </div>

          <div className="mt-4 text-xs text-coal-500">
            <p className="font-medium text-coal-400 mb-1">Valid Coal Grades:</p>
            <p>G1 through G17</p>
            <p className="font-medium text-coal-400 mt-2 mb-1">Valid Sectors:</p>
            <p>Power, Steel, Cement, Railways, Others</p>
          </div>
        </div>
      </div>
    </div>
  );
}
