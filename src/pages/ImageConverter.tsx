import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Upload, FileImage, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Archive, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversionJob, WorkerMessageOut } from "@/workers/converter.worker.ts";
import JSZip from "jszip";

const MAX_CONCURRENT_JOBS = 2; // Prevent OOM by limiting concurrent processing
const MEMORY_TIMEOUT_MS = 3600000; // 1 hour memory limit
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'bmp', 'gif', 'tif', 'tiff'];

export function ImageConverter() {
  const { format } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedTargetFormat, setSelectedTargetFormat] = useState<string>("webp");

  // Handle preloaded files from Home Page
  useEffect(() => {
    if (location.state?.preloadedFiles) {
      if (location.state.preloadedTargetFormat) {
        setSelectedTargetFormat(location.state.preloadedTargetFormat);
      }
      loadFiles(location.state.preloadedFiles);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const sourceFormatsList = ["PNG", "JPG", "WEBP", "HEIC", "GIF", "BMP", "TIFF"];
  const targetFormatsList = ["WEBP", "PNG", "JPG", "GIF"];
  
  // Normalize the active source format from param (case insensitive, default to PNG)
  const activeSourceFormat = format ? format.toUpperCase() : "PNG";

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

  const loadFiles = (filesList: FileList | File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    Array.from(filesList).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setToastError("Unsupported format. To ensure your privacy and device performance, this app only processes supported offline formats.");
      setTimeout(() => setToastError(null), 5000);
    }

    if (validFiles.length > 0) {
      // Auto-detect the extension of the first valid file and update the URL
      const detectedExt = validFiles[0].name.split('.').pop()?.toUpperCase() || 'PNG';
      navigate(`/image-converter/${detectedExt}`, { replace: true });

      const newJobs = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        targetFormat: selectedTargetFormat, // Auto-apply pre-selected target format
        status: 'idle' as const,
        progress: 0
      }));
      setJobs(prev => [...prev, ...newJobs]);
    }
  };

  const handleFilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      loadFiles(e.dataTransfer.files);
    }
  };

  const handleFormatChange = (id: string, format: string) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, targetFormat: format } : job));
  };

  const handleApplyFormatToAll = (format: string) => {
    setSelectedTargetFormat(format);
    setJobs(prev => prev.map(job => job.status === 'idle' ? { ...job, targetFormat: format } : job));
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

  const handleDownloadAllZip = async () => {
    const doneJobs = jobs.filter(j => j.status === 'done' && j.outputUrl);
    if (doneJobs.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      const fetchPromises = doneJobs.map(async (job) => {
        const response = await fetch(job.outputUrl!);
        const blob = await response.blob();
        const originalName = job.file.name.split('.')[0];
        zip.file(`${originalName}.${job.targetFormat}`, blob);
      });

      await Promise.all(fetchPromises);
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `Images_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      URL.revokeObjectURL(zipUrl);
    } catch (e) {
      console.error("Failed to generate zip", e);
      setToastError("Failed to pack files into ZIP. Memory limit exceeded.");
    } finally {
      setIsZipping(false);
    }
  };

  const formatMS = (ms: number | null) => {
    if (ms === null) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectSourceFormat = (src: string) => {
    navigate(`/image-converter/${src}`);
  };

  const handleSelectTargetFormat = (tgt: string) => {
    const tgtLower = tgt.toLowerCase();
    setSelectedTargetFormat(tgtLower);
    setJobs(prev => prev.map(job => job.status === 'idle' ? { ...job, targetFormat: tgtLower } : job));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 relative">
      {/* Toast Notification */}
      {toastError && (
        <div className="fixed top-4 right-4 z-50 bg-[#ff5a5f] border-3 border-black text-white px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-white mt-0.5 stroke-[2.5]" />
          <p className="text-sm font-display font-black leading-relaxed">{toastError}</p>
          <button onClick={() => setToastError(null)} className="shrink-0 p-1 bg-white hover:bg-slate-100 rounded-lg border-2 border-black ml-auto text-black transition-colors shadow-[1.5px_1.5px_0px_0px_#000]">
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-display font-black uppercase tracking-wide text-black">Image Batch Converter</h2>
        <p className="text-slate-700 font-mono text-xs font-semibold mt-1">
          ⚙️ High-performance background rendering engine. 100% Client-Side processing.
        </p>
      </div>

      {/* Quick Format Flow Selector */}
      <div className="bg-white border-3 border-black rounded-xl p-5 space-y-4 shadow-[4px_4px_0px_0px_#000]">
        <h3 className="text-sm font-display font-black uppercase tracking-wider text-black flex items-center gap-2">
          <span>🎯 Pilih Alur Konversi Gambar (Quick Selector)</span>
          <span className="text-xs font-mono font-medium text-slate-500">(atau langsung unggah file Anda)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Source format selection */}
          <div className="space-y-2">
            <label className="text-xs font-display font-extrabold uppercase tracking-wide text-slate-700 block">
              1. Pilih Format Asal (From):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sourceFormatsList.map((src) => {
                const isActive = activeSourceFormat === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => handleSelectSourceFormat(src)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold border-2 transition-all cursor-pointer active:scale-95",
                      isActive
                        ? "bg-[#ff90e8] border-black text-black font-black shadow-[2px_2px_0px_0px_#000]"
                        : "bg-white border-black text-black hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#000]"
                    )}
                  >
                    {src}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target format selection */}
          <div className="space-y-2">
            <label className="text-xs font-display font-extrabold uppercase tracking-wide text-slate-700 block">
              2. Pilih Format Hasil (To):
            </label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {targetFormatsList.map((tgt) => {
                const isActive = selectedTargetFormat === tgt.toLowerCase();
                return (
                  <button
                    key={tgt}
                    type="button"
                    onClick={() => handleSelectTargetFormat(tgt)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-mono font-extrabold border-2 transition-all cursor-pointer active:scale-95",
                      isActive
                        ? "bg-[#a3e635] border-black text-black font-black shadow-[2px_2px_0px_0px_#000]"
                        : "bg-white border-black text-black hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_#000]"
                    )}
                  >
                    {tgt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-[#38bdf8]/10 p-3 rounded-lg border-2 border-black text-xs font-mono font-bold text-black flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">Aliran Konversi Saat Ini:</span>
            <span className="font-mono bg-[#ff90e8] border-2 border-black px-2 py-0.5 rounded text-black font-extrabold shadow-[1px_1px_0px_0px_#000]">{activeSourceFormat}</span>
            <ArrowRight className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span className="font-mono bg-[#a3e635] border-2 border-black px-2 py-0.5 rounded text-black font-extrabold shadow-[1px_1px_0px_0px_#000]">{selectedTargetFormat.toUpperCase()}</span>
          </div>
          <span className="text-[10px] text-slate-600 hidden sm:inline">
            URL: /image-converter/{activeSourceFormat}
          </span>
        </div>
      </div>

      {timeLeft !== null && (
        <div className="bg-[#ffde43] border-3 border-black text-black px-4 py-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-[4px_4px_0px_0px_#000] transition-all">
          <div className="flex items-center">
             <ShieldCheck className="w-5 h-5 mr-3 shrink-0 text-black stroke-[2.5]" />
             <p className="font-bold uppercase tracking-wide">Strict Privacy Policy Active</p>
          </div>
          <div className="font-mono bg-white border-2 border-black px-3 py-1 rounded shadow-[2px_2px_0px_0px_#000] font-black">
            Auto-Purge in: <span className="text-[#e11d48]">{formatMS(timeLeft)}</span>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div 
        className="w-full h-48 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#a3e635]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFilesDrop}
        onClick={() => document.getElementById("img-upload")?.click()}
      >
        <input 
          id="img-upload" 
          type="file" 
          multiple 
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.bmp,.gif,.tif,.tiff"
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              loadFiles(e.target.files);
            }
          }}
        />
        <div className="h-16 w-16 bg-[#ffde43] border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_#000] transition-transform hover:scale-105">
          <Upload className="h-8 w-8 text-black stroke-[2.5]" />
        </div>
        <p className="font-display font-black text-base uppercase tracking-wider">Drag & Drop images or folders</p>
        <p className="text-xs font-mono font-semibold text-slate-600 mt-1">Queue supports HEIC, JPG, PNG, WEBP and more locally.</p>
      </div>

      {/* Jobs Queue */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
          <div className="bg-[#f5f5f0] px-6 py-4 border-b-3 border-black flex flex-col lg:flex-row justify-between items-center gap-4">
             <h3 className="font-display font-black text-sm uppercase tracking-wider text-black shrink-0">Conversion Queue ({jobs.length})</h3>
             <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end w-full lg:w-auto">
               {/* Global Target Format Apply Dropdown */}
               {jobs.some(j => j.status === 'idle') && (
                 <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0px_0px_#000]">
                   <span className="text-[10px] font-mono font-bold uppercase text-slate-500">To All:</span>
                   <select 
                     onChange={(e) => handleApplyFormatToAll(e.target.value)}
                     className="text-xs font-mono font-extrabold bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-black outline-none cursor-pointer"
                     defaultValue=""
                     aria-label="Apply target format to all idle items"
                   >
                     <option value="" disabled>Select Format</option>
                     <option value="webp">WEBP</option>
                     <option value="png">PNG</option>
                     <option value="jpg">JPG</option>
                     <option value="gif">GIF</option>
                   </select>
                 </div>
               )}

               {/* Convert All Button */}
               {jobs.some(j => j.status === 'idle') && (
                 <button 
                   onClick={() => setJobs(prev => prev.map(j => j.status === 'idle' ? { ...j, status: 'queued' } : j))}
                   className="text-xs font-display font-black uppercase tracking-wider text-black bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#000] transition-all cursor-pointer flex items-center active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                   aria-label="Convert all files in queue"
                 >
                   Convert All
                 </button>
               )}

               {jobs.filter(j => j.status === 'done').length > 1 && (
                 <button 
                   onClick={handleDownloadAllZip} 
                   disabled={isZipping}
                   className="text-xs font-display font-black uppercase tracking-wider text-black bg-[#a3e635] hover:bg-[#86efac] border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 cursor-pointer flex items-center focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                   aria-label="Download all completed conversions as ZIP"
                 >
                   {isZipping ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Archive className="w-4 h-4 mr-1.5 stroke-[2.5]" />}
                   {isZipping ? "Zipping..." : "Download ZIP"}
                 </button>
               )}
               <button 
                 onClick={handleClearAll} 
                 className="text-xs font-display font-black uppercase tracking-wider text-[#ff5a5f] bg-red-50 hover:bg-red-100 border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer flex items-center font-bold focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                 aria-label="Clear all files in queue"
               >
                  <Trash2 className="w-4 h-4 mr-1 stroke-[2.5]"/> Clear All
               </button>
             </div>
          </div>
          <div className="divide-y divide-black max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-[#fdfdfb] transition-colors bg-white">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-[#38bdf8]/20 border-2 border-black rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-[1.5px_1.5px_0px_0px_#000]">
                    <FileImage className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-bold text-slate-900 truncate pr-4 font-mono text-xs">{job.file.name}</p>
                     <p className="text-[10px] font-mono text-slate-500 mt-0.5">{(job.file.size / 1024 / 1024).toFixed(2)} MB • Engine: WASM/Canvas</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <select 
                         value={job.targetFormat}
                         onChange={(e) => handleFormatChange(job.id, e.target.value)}
                         className="border-2 border-black rounded-lg px-3 py-1.5 text-xs font-mono font-bold bg-white focus-visible:ring-2 focus-visible:ring-black outline-none"
                         aria-label={`Select target format for ${job.file.name}`}
                       >
                         <option value="webp">to WEBP</option>
                         <option value="png">to PNG</option>
                         <option value="jpg">to JPG</option>
                         <option value="gif">to GIF</option>
                       </select>
                       <button
                         onClick={() => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'queued' } : j))}
                         className="bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black text-black font-display font-black uppercase text-xs px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none cursor-pointer"
                         aria-label={`Convert ${job.file.name}`}
                       >
                         Convert
                       </button>
                     </div>
                   )}

                   {job.status === 'queued' && (
                     <div className="flex items-center text-slate-600 font-mono font-bold text-xs">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[2.5]" />
                       Waiting in queue...
                     </div>
                   )}

                   {job.status === 'processing' && (
                     <div className="flex items-center text-indigo-700 font-mono font-black text-xs">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[2.5]" />
                       {job.progress}%
                     </div>
                   )}

                   {job.status === 'error' && (
                     <div className="flex items-center text-[#ff5a5f] text-xs font-mono font-bold" title={job.error}>
                       <AlertCircle className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                       Failed
                     </div>
                   )}

                   {job.status === 'done' && job.outputUrl && (
                     <a 
                       href={job.outputUrl}
                       download={`converted_${job.file.name.split('.')[0]}.${job.targetFormat}`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                       aria-label={`Save converted ${job.file.name}`}
                     >
                       <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                       Save
                     </a>
                   )}

                   <button 
                     onClick={() => handleRemove(job.id)}
                     className="p-1.5 text-slate-400 hover:text-[#ff5a5f] border-2 border-transparent hover:border-black hover:bg-red-50 rounded-lg transition-colors ml-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-black outline-none"
                     aria-label={`Remove ${job.file.name} from queue`}
                   >
                     <Trash2 className="w-4 h-4 stroke-[2.5]" />
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
