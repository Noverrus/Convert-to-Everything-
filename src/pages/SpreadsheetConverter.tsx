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
        <div className="fixed top-4 right-4 z-50 bg-[#ff5a5f] border-3 border-black text-black px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md font-mono text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-black stroke-[2.5] mt-0.5" />
          <p className="leading-relaxed">{toastError}</p>
          <button 
            onClick={() => setToastError(null)} 
            className="shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors ml-auto focus-visible:ring-2 focus-visible:ring-black outline-none"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4 text-black stroke-[2.5]" />
          </button>
        </div>
      )}

      <div className="border-3 border-black bg-white p-6 sm:p-8 rounded-xl shadow-[6px_6px_0px_0px_#000]">
        <h2 className="text-3xl font-display font-black uppercase tracking-wider text-black">Spreadsheet & Data Converter</h2>
        <p className="text-slate-600 font-mono text-xs font-bold mt-2">
          Convert CSV to JSON or JSON to CSV seamlessly offline. Perfect for database analysts and web developers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div 
            className="w-full h-40 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#a3e635]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
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
            <div className="h-10 w-10 bg-[#ffde43] border-2 border-black rounded-lg flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_#000]">
              <Upload className="h-5 w-5 text-black stroke-[2.5]" />
            </div>
            <p className="font-display font-black text-sm uppercase tracking-wide">Upload CSV or JSON</p>
            <p className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">Local offline converter</p>
          </div>

          {jobs.length > 0 && (
            <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <div className="bg-[#f5f5f0] px-4 py-3 border-b-3 border-black">
                <span className="font-display font-black text-xs uppercase tracking-wider text-black">Data Queue</span>
              </div>
              <div className="divide-y divide-black max-h-[300px] overflow-y-auto">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => setActiveJob(job)}
                    className={cn(
                      "p-3 flex items-center justify-between cursor-pointer transition-colors text-sm",
                      activeJob?.id === job.id ? "bg-[#ff90e8]/20" : "hover:bg-[#fdfdfb]"
                    )}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <FileSpreadsheet className="w-4 h-4 text-black stroke-[2.5] mr-2 shrink-0" />
                      <span className="truncate font-mono font-bold text-xs text-slate-800">{job.file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(job.id);
                      }}
                      className="p-1 text-slate-400 hover:text-[#ff5a5f] border-2 border-transparent hover:border-black hover:bg-red-50 rounded-lg transition-colors ml-2 focus-visible:ring-2 focus-visible:ring-black outline-none"
                      aria-label={`Remove ${job.file.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] p-6 flex flex-col space-y-6 min-h-[350px]">
          {activeJob ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-display font-black uppercase text-sm tracking-wide text-black">Convert Data Sheet</h4>
                  <p className="text-[10px] font-mono font-bold text-slate-500">Source: {activeJob.file.name}</p>
                </div>
                {activeJob.status === 'idle' && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={activeJob.targetFormat}
                      onChange={(e) => setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, targetFormat: e.target.value as any } : j))}
                      className="border-2 border-black rounded-lg px-2.5 py-1 text-xs font-mono font-bold bg-white focus-visible:ring-2 focus-visible:ring-black outline-none"
                      aria-label="Select target sheet format"
                    >
                      {activeJob.file.name.endsWith('.csv') ? (
                        <option value="json">JSON Format</option>
                      ) : (
                        <option value="csv">CSV Sheet</option>
                      )}
                    </select>
                    <button
                      onClick={() => handleConvert(activeJob)}
                      className="bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black text-black font-display font-black uppercase text-xs px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none cursor-pointer"
                      aria-label="Convert spreadsheet file"
                    >
                      Convert
                    </button>
                  </div>
                )}

                {activeJob.status === 'done' && activeJob.outputUrl && (
                  <a 
                    href={activeJob.outputUrl}
                    download={`${activeJob.file.name.split('.')[0]}.${activeJob.targetFormat}`}
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                    aria-label={`Save converted ${activeJob.file.name}`}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" /> Save File
                  </a>
                )}
              </div>

              <div className="flex-1 border-3 border-black rounded-xl overflow-hidden bg-slate-950 p-4 max-h-[300px] overflow-y-auto shadow-[2px_2px_0px_0px_#000]">
                <pre className="text-xs text-[#a3e635] font-mono select-all whitespace-pre-wrap">
                  {activeJob.outputContent || "Please hit 'Convert' to trigger the parser engine."}
                </pre>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <FileSpreadsheet className="w-12 h-12 mb-3 text-black stroke-[1.5] opacity-40" />
              <p className="text-xs font-mono font-bold text-slate-600">Select or upload a spreadsheet file to trigger conversions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
