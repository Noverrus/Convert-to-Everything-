import React, { useState, useEffect } from "react";
import { Upload, FileSpreadsheet, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetJob {
  id: string;
  file: File;
  targetFormat: 'json' | 'csv' | 'html';
  status: 'idle' | 'processing' | 'done' | 'error';
  outputUrl?: string;
  outputContent?: string;
}

export function SpreadsheetConverter() {
  const [jobs, setJobs] = useState<SheetJob[]>([]);
  const [activeJob, setActiveJob] = useState<SheetJob | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const loadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'csv' && ext !== 'json') {
      setToastError("Unsupported data sheet. Please upload .csv or .json files.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    const newJob: SheetJob = {
      id: crypto.randomUUID(),
      file,
      targetFormat: ext === 'csv' ? 'json' : 'csv',
      status: 'idle'
    };
    setJobs(prev => [...prev, newJob]);
    setActiveJob(newJob);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async (job: SheetJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        let outputText = "";
        let mimeType = "text/plain";

        const ext = job.file.name.split('.').pop()?.toLowerCase();

        if (ext === 'csv' && job.targetFormat === 'json') {
          // Parse CSV to JSON
          const lines = text.split(/\r?\n/);
          const headers = lines[0].split(',');
          const result = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const obj: any = {};
            const currentline = lines[i].split(',');
            for (let j = 0; j < headers.length; j++) {
              obj[headers[j].trim()] = currentline[j]?.trim() || "";
            }
            result.push(obj);
          }
          outputText = JSON.stringify(result, null, 2);
          mimeType = "application/json";
        } else if (ext === 'json' && job.targetFormat === 'csv') {
          // Convert JSON array of objects to CSV
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const csvRows = [];
            csvRows.push(headers.join(','));
            for (const row of data) {
              const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
              });
              csvRows.push(values.join(','));
            }
            outputText = csvRows.join('\n');
            mimeType = "text/csv";
          } else {
            throw new Error("JSON must be an array of objects");
          }
        } else {
          // HTML Preview Table
          outputText = text;
        }

        const blob = new Blob([outputText], { type: mimeType });
        const outputUrl = URL.createObjectURL(blob);

        const updated = {
          ...job,
          status: 'done' as const,
          outputUrl,
          outputContent: outputText
        };

        setJobs(prev => prev.map(j => j.id === job.id ? updated : j));
        if (activeJob?.id === job.id) {
          setActiveJob(updated);
        }
      };
      reader.readAsText(job.file);
    } catch (err: any) {
      console.error(err);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error' } : j));
    }
  };

  const handleRemove = (id: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (job?.outputUrl) URL.revokeObjectURL(job.outputUrl);
      return prev.filter(j => j.id !== id);
    });
    if (activeJob?.id === id) setActiveJob(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 relative">
      {toastError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{toastError}</p>
          <button onClick={() => setToastError(null)} className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-slate-800">Spreadsheet & Data Converter</h2>
        <p className="text-slate-500 mt-1">
          Convert CSV to JSON or JSON to CSV seamlessly offline. Perfect for database analysts and web developers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div 
            className="w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("sheet-upload")?.click()}
          >
            <input 
              id="sheet-upload" 
              type="file" 
              accept=".csv,.json"
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  loadFile(e.target.files[0]);
                }
              }}
            />
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <Upload className="h-5 w-5 text-slate-500" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Upload CSV or JSON</p>
            <p className="text-xs text-slate-500 mt-0.5">Local offline converter</p>
          </div>

          {jobs.length > 0 && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b">
                <span className="font-semibold text-sm text-slate-700">Data Queue</span>
              </div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => setActiveJob(job)}
                    className={cn(
                      "p-3 flex items-center justify-between cursor-pointer transition-colors text-sm",
                      activeJob?.id === job.id ? "bg-indigo-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
                      <span className="truncate font-medium text-slate-800">{job.file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(job.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6 flex flex-col space-y-6 min-h-[350px]">
          {activeJob ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Convert Data Sheet</h4>
                  <p className="text-xs text-slate-500">Source: {activeJob.file.name}</p>
                </div>
                {activeJob.status === 'idle' && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={activeJob.targetFormat}
                      onChange={(e) => setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, targetFormat: e.target.value as any } : j))}
                      className="border rounded px-2.5 py-1 text-xs bg-white"
                    >
                      {activeJob.file.name.endsWith('.csv') ? (
                        <option value="json">JSON Format</option>
                      ) : (
                        <option value="csv">CSV Sheet</option>
                      )}
                    </select>
                    <button
                      onClick={() => handleConvert(activeJob)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      Convert
                    </button>
                  </div>
                )}

                {activeJob.status === 'done' && activeJob.outputUrl && (
                  <a 
                    href={activeJob.outputUrl}
                    download={`${activeJob.file.name.split('.')[0]}.${activeJob.targetFormat}`}
                    className="inline-flex items-center justify-center px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Save File
                  </a>
                )}
              </div>

              <div className="flex-1 border rounded-xl overflow-hidden bg-slate-950 p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-xs text-emerald-400 font-mono select-all whitespace-pre-wrap">
                  {activeJob.outputContent || "Please hit 'Convert' to trigger the parser engine."}
                </pre>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <FileSpreadsheet className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select or upload a spreadsheet file to trigger conversions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
