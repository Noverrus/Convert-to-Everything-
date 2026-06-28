import React, { useState, useRef, useEffect, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Upload, FileVideo, Download, Loader2, AlertCircle, RefreshCcw, Trash2, ShieldCheck, X, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
const SUPPORTED_EXTENSIONS = ['mp4','webm','avi','mov','mkv','wmv','flv','mp3','wav','ogg','m4a','aac','flac'];

interface MediaJob {
  id: string;
  file: File;
  targetFormat: string;
  quality: string;
  status: 'idle' | 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  outputUrl?: string;
  error?: string;
}

export function VideoConverter() {
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [toastError, setToastError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Initialize FFmpeg
  const loadFFmpeg = async () => {
    if (loaded || ffmpegRef.current) return;
    setLoadingMsg("Loading FFmpeg engine...");
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setLoaded(true);
      setLoadingMsg("");
    } catch (error: any) {
      console.error(error);
      setToastError("Failed to load FFmpeg kernel. Check your network.");
      setLoadingMsg("");
    }
  };

  useEffect(() => {
    loadFFmpeg();
    return () => {
      jobs.forEach(job => {
        if (job.outputUrl) URL.revokeObjectURL(job.outputUrl);
      });
    };
  }, []);

  const handleClearAll = useCallback(() => {
    jobs.forEach(job => {
      if (job.outputUrl) URL.revokeObjectURL(job.outputUrl);
    });
    setJobs([]);
  }, [jobs]);

  // Global Memory Cleanup Timer (1 Hour after any successful job)
  useEffect(() => {
    const MEMORY_TIMEOUT_MS = 3600000;
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
  }, [jobs, timeLeft, handleClearAll]);

  // Process Queue (Sequential execution for Video to avoid OOM)
  useEffect(() => {
    const processQueue = async () => {
      const activeCount = jobs.filter(j => j.status === 'processing').length;
      if (activeCount > 0) return; // Only process 1 at a time

      const queuedJob = jobs.find(j => j.status === 'queued');
      if (!queuedJob) return;

      if (!loaded) await loadFFmpeg();
      if (!ffmpegRef.current || !loaded) return;

      const ffmpeg = ffmpegRef.current;
      setJobs(prev => prev.map(j => j.id === queuedJob.id ? { ...j, status: 'processing', progress: 0 } : j));

      try {
        const inputName = `input_${queuedJob.id}.${queuedJob.file.name.split('.').pop()}`;
        const outputName = `output_${queuedJob.id}.${queuedJob.targetFormat}`;

        ffmpeg.on("progress", ({ progress }) => {
          setJobs(prev => prev.map(j => j.id === queuedJob.id ? { ...j, progress: Math.round(progress * 100) } : j));
        });

        await ffmpeg.writeFile(inputName, await fetchFile(queuedJob.file));
        
        let ffmpegArgs = ["-i", inputName];

        const isVideo = ['mp4','webm','avi','mov','mkv','wmv','flv'].includes(queuedJob.targetFormat);
        
        if (isVideo) {
          if (queuedJob.targetFormat === 'mp4') {
             ffmpegArgs.push("-vcodec", "libx264");
             switch (queuedJob.quality) {
               case 'high': ffmpegArgs.push("-crf", "18"); break;
               case 'medium': ffmpegArgs.push("-crf", "23"); break;
               case 'low': ffmpegArgs.push("-crf", "28"); break;
             }
          }
        }

        ffmpegArgs.push(outputName);
        await ffmpeg.exec(ffmpegArgs);

        const data = await ffmpeg.readFile(outputName);
        let mime = isVideo ? `video/${queuedJob.targetFormat}` : `audio/${queuedJob.targetFormat}`;
        const blob = new Blob([data], { type: mime });
        const outputUrl = URL.createObjectURL(blob);

        setJobs(prev => prev.map(j => j.id === queuedJob.id ? { ...j, status: 'done', progress: 100, outputUrl } : j));

        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (err: any) {
        setJobs(prev => prev.map(j => j.id === queuedJob.id ? { ...j, status: 'error', error: "FFmpeg conversion failed." } : j));
      }
    };

    processQueue();
  }, [jobs, loaded]);

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
      setToastError("Unsupported format. Please upload standard media formats.");
      setTimeout(() => setToastError(null), 5000);
    }

    if (validFiles.length > 0) {
      const newJobs: MediaJob[] = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        targetFormat: 'mp4',
        quality: 'medium',
        status: 'idle',
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

  const handleRemove = (id: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (job?.outputUrl) {
        URL.revokeObjectURL(job.outputUrl);
      }
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
      link.download = `Video_${Date.now()}.zip`;
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
        <h2 className="text-3xl font-bold text-slate-800">Video & Audio Batch Converter</h2>
        <p className="text-slate-500 mt-1">
          Convert videos and audio offline using WebAssembly. Files process sequentially to protect memory.
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

      <div 
        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFilesDrop}
        onClick={() => document.getElementById("media-upload")?.click()}
      >
        <input 
          id="media-upload" 
          type="file" 
          multiple 
          accept=".mp4,.webm,.avi,.mov,.mkv,.wmv,.flv,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              loadFiles(e.target.files);
            }
          }}
        />
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
          <Upload className="h-8 w-8 text-slate-500" />
        </div>
        <p className="font-semibold text-slate-800">Drag & Drop video or audio files</p>
        <p className="text-sm text-slate-500 mt-1">Accepts MP4, WEBM, AVI, MP3, WAV and more.</p>
        {loadingMsg && <p className="text-xs text-indigo-500 mt-2 flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin"/> {loadingMsg}</p>}
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700">Video Queue ({jobs.length})</h3>
             <div className="flex items-center gap-4">
               {jobs.filter(j => j.status === 'done').length > 1 && (
                 <button 
                   onClick={handleDownloadAllZip} 
                   disabled={isZipping}
                   className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                 >
                   {isZipping ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Archive className="w-4 h-4 mr-1.5" />}
                   {isZipping ? "Zipping..." : "Download ZIP"}
                 </button>
               )}
               <button onClick={handleClearAll} className="text-sm text-red-600 hover:text-red-700 flex items-center">
                  <Trash2 className="w-4 h-4 mr-1"/> Clear All
               </button>
             </div>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center shrink-0 mr-4">
                     <FileVideo className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-slate-900 truncate pr-4">{job.file.name}</p>
                     <p className="text-xs text-slate-500 mt-0.5">{(job.file.size / 1024 / 1024).toFixed(2)} MB • Engine: FFmpeg WASM</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <select 
                         value={job.targetFormat}
                         onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, targetFormat: e.target.value } : j))}
                         className="border rounded px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                       >
                         <optgroup label="Video">
                           <option value="mp4">MP4</option>
                           <option value="webm">WebM</option>
                           <option value="avi">AVI</option>
                         </optgroup>
                         <optgroup label="Audio">
                           <option value="mp3">MP3</option>
                           <option value="wav">WAV</option>
                         </optgroup>
                       </select>
                       
                       {['mp4','webm','avi'].includes(job.targetFormat) && (
                         <select 
                           value={job.quality}
                           onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, quality: e.target.value } : j))}
                           className="border rounded px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                         >
                           <option value="high">High Quality</option>
                           <option value="medium">Medium Form</option>
                           <option value="low">Max Compress</option>
                         </select>
                       )}

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
                     <div className="flex items-center text-indigo-600 font-medium text-sm w-full min-w-[120px]">
                        <div className="hidden sm:block w-full bg-slate-200 rounded-full h-1.5 mr-3 max-w-[80px]">
                           <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${job.progress}%` }}></div>
                        </div>
                       <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
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
