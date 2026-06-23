import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileImage, Download, Loader2, AlertCircle, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversionJob, WorkerMessageOut } from "@/workers/converter.worker.ts";

const MAX_CONCURRENT_JOBS = 2; // Prevent OOM by limiting concurrent processing
const MEMORY_TIMEOUT_MS = 3600000; // 1 hour memory limit

export function ImageConverter() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Initialize Worker
  useEffect(() => {
    // Standard Vite module worker import
    workerRef.current = new Worker(new URL('../workers/converter.worker.ts', import.meta.url), {
      type: 'module'
    });

    workerRef.current.onerror = (e) => {
      console.error("Worker error:", e);
    };

    workerRef.current.onmessage = (e: MessageEvent<WorkerMessageOut>) => {
      const { type, id } = e.data;
      
      setJobs(currentJobs => currentJobs.map(job => {
        if (job.id !== id) return job;

        switch (type) {
          case 'PROGRESS':
            return { ...job, progress: e.data.progress };
          case 'COMPLETE':
            // Generate Object URL that must be manually revoked to prevent leaks
            const url = URL.createObjectURL(e.data.blob);
            return { ...job, status: 'done', progress: 100, outputUrl: url };
          case 'ERROR':
            if ('requiresCloudFallback' in e.data && e.data.requiresCloudFallback) {
               return { ...job, status: 'cloud_fallback_required', progress: 0 };
            }
            return { ...job, status: 'error', error: e.data.error, progress: 0 };
          default:
            return job;
        }
      }));
    };

    return () => {
      workerRef.current?.terminate();
      jobs.forEach(job => {
        if (job.outputUrl) URL.revokeObjectURL(job.outputUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloudFallback = async (jobId: string) => {
     setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'processing', progress: 10 } : j));
     
     const job = jobs.find(j => j.id === jobId);
     if (!job) return;

     try {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: 30 } : j));
        
        // Trigger server API proxy route
        const res = await fetch('/api/convert/cloud', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ fileName: job.file.name, targetFormat: job.targetFormat })
        });
        
        const data = await res.json();
        
        if (res.ok) {
           // Simulate completion after receiving the presigned workflow completion
           setTimeout(() => {
              setJobs(prev => prev.map(j => j.id === jobId ? {
                 ...j,
                 status: 'done',
                 progress: 100,
                 // For safety in this demo, we mock the output URL
                 outputUrl: URL.createObjectURL(new Blob(['Cloud Fallback Mock Data File'], { type: 'text/plain'}))
              } : j));
           }, 2000);
        } else {
           throw new Error(data.error);
        }

     } catch (e) {
        console.error("Cloud Fallback Upload Error:", e);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: 'Cloud upload failed' } : j));
     }
  };

  // Global Memory Cleanup Timer (1 Hour after any successful job)
  useEffect(() => {
    const hasCompletes = jobs.some(j => j.status === 'done');
    
    if (hasCompletes && timeLeft === null) {
      setTimeLeft(MEMORY_TIMEOUT_MS);
    } else if (!hasCompletes) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1000) {
          clearInterval(interval);
          handleClearAll();
          return null;
        }
        return prev ? prev - 1000 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [jobs, timeLeft]);

  // Handle Smart Queue Processing
  useEffect(() => {
    const processQueue = () => {
      const activeCount = jobs.filter(j => j.status === 'processing').length;
      if (activeCount >= MAX_CONCURRENT_JOBS) return;

      const queuedJobs = jobs.filter(j => j.status === 'queued');
      const jobsToStart = queuedJobs.slice(0, MAX_CONCURRENT_JOBS - activeCount);

      if (jobsToStart.length > 0) {
        setJobs(current => current.map(job => 
          jobsToStart.find(j => j.id === job.id) ? { ...job, status: 'processing' } : job
        ));

        jobsToStart.forEach(job => {
          workerRef.current?.postMessage({
            type: 'START_CONVERSION',
            job: { id: job.id, file: job.file, targetFormat: job.targetFormat }
          });
        });
      }
    };

    processQueue();
  }, [jobs]);

  const handleFilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newJobs = Array.from(e.dataTransfer.files).map(file => ({
        id: crypto.randomUUID(),
        file,
        targetFormat: 'webp', // Default format
        status: 'idle' as const,
        progress: 0
      }));
      setJobs(prev => [...prev, ...newJobs]);
    }
  };

  const handleFormatChange = (id: string, format: string) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, targetFormat: format } : job));
  };

  const handleRemove = (id: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (job?.outputUrl) {
        URL.revokeObjectURL(job.outputUrl); // Strict memory cleanup
      }
      return prev.filter(j => j.id !== id);
    });
  };

  const handleClearAll = useCallback(() => {
    jobs.forEach(job => {
      if (job.outputUrl) URL.revokeObjectURL(job.outputUrl);
    });
    setJobs([]);
  }, [jobs]);

  const formatMS = (ms: number | null) => {
    if (ms === null) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Image Batch Converter</h2>
        <p className="text-slate-500 mt-1">
          High-performance background rendering engine. Supports WASM local and Cloud fallback for advanced formats.
        </p>
      </div>

      {timeLeft !== null && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm shadow-sm transition-all animate-in slide-in-from-top-2">
          <div className="flex items-center">
             <ShieldCheck className="w-5 h-5 mr-3 shrink-0 text-amber-600" />
             <p className="font-medium">Strict Privacy Policy Active</p>
          </div>
          <div className="font-mono bg-white px-3 py-1 rounded shadow-sm">
            Auto-Purge in: <span className="font-bold">{formatMS(timeLeft)}</span>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div 
        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFilesDrop}
        onClick={() => document.getElementById("img-upload")?.click()}
      >
        <input 
          id="img-upload" 
          type="file" 
          multiple 
          accept="image/*,.heic,.psd,.djv,.eps,.ppm,.art,.dpx,.wmz,.dds,.avif,.pcx"
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              const newJobs = Array.from(e.target.files).map(file => ({
                id: crypto.randomUUID(),
                file,
                targetFormat: 'webp',
                status: 'idle' as const,
                progress: 0
              }));
              setJobs(prev => [...prev, ...newJobs]);
            }
          }}
        />
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <Upload className="h-8 w-8 text-slate-500" />
        </div>
        <p className="font-semibold text-slate-800">Drag & Drop images or folders</p>
        <p className="text-sm text-slate-500 mt-1">Queue natively supports HEIC, JPG, PNG, WEBP. Advanced formats (AVIF, EPS, DDS, etc) use Cloud Fallback.</p>
      </div>

      {/* Jobs Queue */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700">Conversion Queue ({jobs.length})</h3>
             <button onClick={handleClearAll} className="text-sm text-red-600 hover:text-red-700 flex items-center">
                <Trash2 className="w-4 h-4 mr-1"/> Clear All
             </button>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center shrink-0 mr-4">
                    <FileImage className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-slate-900 truncate pr-4">{job.file.name}</p>
                     <p className="text-xs text-slate-500 mt-0.5">{(job.file.size / 1024 / 1024).toFixed(2)} MB • Engine: Auto</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <select 
                         value={job.targetFormat}
                         onChange={(e) => handleFormatChange(job.id, e.target.value)}
                         className="border rounded px-3 py-1.5 text-sm bg-white focus:ring-2 outline-none focus:ring-indigo-500"
                       >
                         <option value="webp">to WEBP</option>
                         <option value="png">to PNG</option>
                         <option value="jpg">to JPG</option>
                         <option value="avif">to AVIF</option>
                         <option value="heic">to HEIC</option>
                         <option value="eps">to EPS</option>
                         <option value="dds">to DDS</option>
                         <option value="dpx">to DPX</option>
                         <option value="pcx">to PCX</option>
                         <option value="ppm">to PPM</option>
                         <option value="djv">to DJV</option>
                         <option value="wmz">to WMZ</option>
                         <option value="art">to ART</option>
                       </select>
                       <button
                         onClick={() => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'queued' } : j))}
                         className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition"
                       >
                         Convert
                       </button>
                     </div>
                   )}

                   {job.status === 'queued' && (
                     <div className="flex items-center text-slate-500 font-medium text-sm">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Waiting in queue...
                     </div>
                   )}

                   {job.status === 'processing' && (
                     <div className="flex items-center text-indigo-600 font-medium text-sm">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       {job.progress}%
                     </div>
                   )}

                   {job.status === 'cloud_fallback_required' && (
                     <div className="flex flex-col sm:flex-row items-center gap-3">
                       <p className="text-xs text-amber-600 font-medium hidden sm:block">Memory Low</p>
                       <button 
                         onClick={() => handleCloudFallback(job.id)}
                         className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded transition-colors"
                       >
                         Switch to Cloud
                       </button>
                     </div>
                   )}

                   {job.status === 'error' && (
                     <div className="flex items-center text-red-600 text-sm font-medium">
                       <AlertCircle className="w-4 h-4 mr-1.5" />
                       Failed
                     </div>
                   )}

                   {job.status === 'done' && job.outputUrl && (
                     <a 
                       href={job.outputUrl}
                       download={`converted_${job.file.name.split('.')[0]}.${job.targetFormat}`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                     >
                       <Download className="w-4 h-4 mr-1.5" />
                       Save
                     </a>
                   )}

                   <button 
                     onClick={() => handleRemove(job.id)}
                     className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
