import React, { useState, useEffect, useCallback } from "react";
import { Upload, FileArchive, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, FolderOpen, File } from "lucide-react";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

interface ArchiveJob {
  id: string;
  files: File[];
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputUrl?: string;
  outputName: string;
  error?: string;
}

interface ExtractedFile {
  name: string;
  blob: Blob;
  size: number;
  url: string;
}

export function ArchiveConverter() {
  const [packJobs, setPackJobs] = useState<ArchiveJob[]>([]);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isUnzipping, setIsUnzipping] = useState(false);

  const handleClearAll = useCallback(() => {
    packJobs.forEach(job => {
      if (job.outputUrl) URL.revokeObjectURL(job.outputUrl);
    });
    extractedFiles.forEach(file => {
      URL.revokeObjectURL(file.url);
    });
    setPackJobs([]);
    setExtractedFiles([]);
  }, [packJobs, extractedFiles]);

  // Global Memory Cleanup Timer (1 Hour)
  useEffect(() => {
    const MEMORY_TIMEOUT_MS = 3600000;
    const hasCompletes = packJobs.some(j => j.status === 'done') || extractedFiles.length > 0;
    
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
  }, [packJobs, extractedFiles, timeLeft, handleClearAll]);

  const loadFilesForPacking = (filesList: FileList | File[]) => {
    const validFiles = Array.from(filesList);
    if (validFiles.length > 0) {
      const id = crypto.randomUUID();
      const newJob: ArchiveJob = {
        id,
        files: validFiles,
        status: 'idle',
        progress: 0,
        outputName: `archive_${Date.now()}.zip`
      };
      setPackJobs(prev => [...prev, newJob]);
    }
  };

  const handleZipDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      loadFilesForPacking(e.dataTransfer.files);
    }
  };

  const handleUnzipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setToastError("Please upload a valid .zip file.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    setIsUnzipping(true);
    setExtractedFiles([]);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const files: ExtractedFile[] = [];

      const fileKeys = Object.keys(loadedZip.files);
      for (const key of fileKeys) {
        const zipEntry = loadedZip.files[key];
        if (!zipEntry.dir) {
          const blob = await zipEntry.async("blob");
          const url = URL.createObjectURL(blob);
          files.push({
            name: zipEntry.name,
            blob,
            size: blob.size,
            url
          });
        }
      }

      setExtractedFiles(files);
    } catch (err) {
      console.error(err);
      setToastError("Failed to unzip the file. The archive might be corrupted.");
    } finally {
      setIsUnzipping(false);
    }
  };

  const processPackJob = async (id: string) => {
    setPackJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'processing', progress: 10 } : job));

    try {
      const job = packJobs.find(j => j.id === id);
      if (!job) return;

      const zip = new JSZip();
      
      job.files.forEach(file => {
        zip.file(file.name, file);
      });

      setPackJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 50 } : j));

      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        setPackJobs(prev => prev.map(j => j.id === id ? { ...j, progress: Math.round(metadata.percent) } : j));
      });

      const outputUrl = URL.createObjectURL(zipBlob);
      setPackJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done', progress: 100, outputUrl } : j));

    } catch (err) {
      console.error(err);
      setPackJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'error', error: "Compression failed." } : j));
    }
  };

  const handleRemovePackJob = (id: string) => {
    setPackJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (job?.outputUrl) URL.revokeObjectURL(job.outputUrl);
      return prev.filter(j => j.id !== id);
    });
  };

  const formatMS = (ms: number | null) => {
    if (ms === null) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        <h2 className="text-3xl font-bold text-slate-800">Archive Manager</h2>
        <p className="text-slate-500 mt-1">
          Compress files into high-performance ZIP archives or extract ZIPs offline inside your browser.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create ZIP */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Create ZIP Archive</h3>
          <div 
            className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleZipDrop}
            onClick={() => document.getElementById("zip-upload")?.click()}
          >
            <input 
              id="zip-upload" 
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) {
                  loadFilesForPacking(e.target.files);
                }
              }}
            />
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-slate-500" />
            </div>
            <p className="font-semibold text-slate-800">Drag & Drop files to ZIP</p>
            <p className="text-sm text-slate-500 mt-1">Select multiple files</p>
          </div>
        </div>

        {/* Extract ZIP */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800">Extract ZIP Archive</h3>
          <div 
            className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-emerald-400 bg-white hover:bg-emerald-50/10 cursor-pointer transition-colors"
            onClick={() => document.getElementById("unzip-upload")?.click()}
          >
            <input 
              id="unzip-upload" 
              type="file" 
              accept=".zip"
              className="hidden" 
              onChange={handleUnzipFile}
            />
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="h-6 w-6 text-slate-500" />
            </div>
            <p className="font-semibold text-slate-800">Select .zip file to extract</p>
            <p className="text-sm text-slate-500 mt-1">Extract files completely client-side</p>
          </div>
        </div>
      </div>

      {packJobs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700">Archiving Queue ({packJobs.length})</h3>
             <button onClick={handleClearAll} className="text-sm text-red-600 hover:text-red-700 flex items-center">
                <Trash2 className="w-4 h-4 mr-1"/> Clear All
             </button>
          </div>
          <div className="divide-y max-h-[300px] overflow-y-auto">
            {packJobs.map(job => (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center shrink-0 mr-4">
                     <FileArchive className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-slate-900 truncate">{job.outputName}</p>
                     <p className="text-xs text-slate-500 mt-0.5">{job.files.length} files included</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                   {job.status === 'idle' && (
                     <button
                       onClick={() => processPackJob(job.id)}
                       className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition"
                     >
                       Pack ZIP
                     </button>
                   )}

                   {job.status === 'processing' && (
                     <div className="flex items-center text-indigo-600 font-medium text-sm">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       {job.progress}%
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
                       download={job.outputName}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                     >
                       <Download className="w-4 h-4 mr-1.5" />
                       Save ZIP
                     </a>
                   )}

                   <button 
                     onClick={() => handleRemovePackJob(job.id)}
                     className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUnzipping && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-3 text-slate-700 font-semibold">Extracting archive...</span>
        </div>
      )}

      {extractedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700">Extracted Files ({extractedFiles.length})</h3>
             <button onClick={() => setExtractedFiles([])} className="text-sm text-red-600 hover:text-red-700 flex items-center">
                <Trash2 className="w-4 h-4 mr-1"/> Clear List
             </button>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {extractedFiles.map((file, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="h-10 w-10 bg-emerald-100 rounded flex items-center justify-center shrink-0 mr-4">
                     <File className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-slate-900 truncate pr-4">{file.name}</p>
                     <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <a 
                  href={file.url}
                  download={file.name}
                  className="inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors ml-4 shrink-0"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Save File
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
