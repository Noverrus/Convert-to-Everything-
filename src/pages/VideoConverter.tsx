import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [toastError, setToastError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Handle preloaded files from Home Page
  useEffect(() => {
    if (location.state?.preloadedFiles) {
      const targetFormat = location.state.preloadedTargetFormat || "mp4";
      const validFiles: File[] = [];
      const invalidFiles: File[] = [];

      Array.from(location.state.preloadedFiles as File[]).forEach(file => {
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
          targetFormat: targetFormat,
          quality: 'medium',
          status: 'idle',
          progress: 0
        }));
        setJobs(prev => [...prev, ...newJobs]);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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

  const handleApplyFormatToAll = (format: string) => {
    setJobs(prev => prev.map(job => job.status === 'idle' ? { ...job, targetFormat: format } : job));
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

  // Calculations for global queue progress
  const totalCount = jobs.length;
  const doneCount = jobs.filter(j => j.status === 'done').length;
  const processingCount = jobs.filter(j => j.status === 'processing' || j.status === 'queued').length;
  const globalProgressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

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
        <h2 className="text-3xl font-display font-black uppercase tracking-wider text-black">Video & Audio Batch Converter</h2>
        <p className="text-slate-600 font-mono text-xs font-bold mt-2">
          Convert videos and audio files offline using high-performance WebAssembly. Files process sequentially to optimize memory.
        </p>
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

      {/* Global Queue Progress Indicator */}
      {processingCount > 0 && (
        <div className="bg-[#38bdf8] border-3 border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_#000] font-mono text-xs text-black flex flex-col gap-2">
          <div className="flex justify-between font-black uppercase tracking-wider">
            <span>Processing queue: {doneCount} of {totalCount} files converted</span>
            <span>{globalProgressPercent}% Completed</span>
          </div>
          <div className="w-full bg-white border-2 border-black rounded-lg h-5 overflow-hidden shadow-[2px_2px_0px_0px_#000] relative flex items-center justify-center">
            <div className="bg-[#a3e635] h-full border-r-2 border-black transition-all duration-300 absolute left-0 top-0" style={{ width: `${globalProgressPercent}%` }}></div>
            <span className="relative z-10 font-bold font-mono text-[10px] text-black uppercase">Batch conversion in progress</span>
          </div>
        </div>
      )}

      <div 
        className="w-full h-48 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#a3e635]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
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
        <div className="h-16 w-16 bg-[#ffde43] border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_#000] transition-transform hover:scale-105">
          <Upload className="h-8 w-8 text-black stroke-[2.5]" />
        </div>
        <p className="font-display font-black text-base uppercase tracking-wider">Drag & Drop video or audio files</p>
        <p className="text-xs font-mono font-semibold text-slate-600 mt-1">Accepts MP4, WEBM, AVI, MP3, WAV and other common offline formats.</p>
        {loadingMsg && <p className="text-xs font-mono font-bold text-indigo-600 mt-2 flex items-center"><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/> {loadingMsg}</p>}
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
           <div className="bg-[#f5f5f0] px-6 py-4 border-b-3 border-black flex flex-col lg:flex-row justify-between items-center gap-4">
             <h3 className="font-display font-black text-sm uppercase tracking-wider text-black shrink-0">Video Queue ({jobs.length})</h3>
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
                     <option value="mp4">MP4 Video</option>
                     <option value="webm">WebM Video</option>
                     <option value="avi">AVI Video</option>
                     <option value="mp3">MP3 Audio</option>
                     <option value="wav">WAV Audio</option>
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
                  <div className="h-10 w-10 bg-[#ff90e8]/20 border-2 border-black rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-[1.5px_1.5px_0px_0px_#000]">
                     <FileVideo className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-bold text-slate-900 truncate pr-4 font-mono text-xs">{job.file.name}</p>
                     <p className="text-[10px] font-mono text-slate-500 mt-0.5">{(job.file.size / 1024 / 1024).toFixed(2)} MB • Engine: FFmpeg WASM</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex flex-wrap items-center gap-2">
                       <select 
                         value={job.targetFormat}
                         onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, targetFormat: e.target.value } : j))}
                         className="border-2 border-black rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus-visible:ring-2 focus-visible:ring-black outline-none"
                         aria-label={`Target format for ${job.file.name}`}
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
                           className="border-2 border-black rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus-visible:ring-2 focus-visible:ring-black outline-none"
                           aria-label={`Video quality for ${job.file.name}`}
                         >
                           <option value="high">High Quality</option>
                           <option value="medium">Medium Form</option>
                           <option value="low">Max Compress</option>
                         </select>
                       )}

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
                     <div className="flex items-center text-indigo-700 font-mono font-black text-xs min-w-[120px]">
                        <div className="hidden sm:block w-full bg-slate-200 border-2 border-black rounded-full h-3 mr-3 overflow-hidden">
                           <div className="bg-[#a3e635] h-full" style={{ width: `${job.progress}%` }}></div>
                        </div>
                       <Loader2 className="w-4 h-4 mr-1.5 animate-spin stroke-[2.5]" />
                       {job.progress}%
                     </div>
                   )}

                   {job.status === 'error' && (
                     <div className="flex items-center text-[#ff5a5f] text-xs font-mono font-bold">
                       <AlertCircle className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                       Failed
                     </div>
                   )}

                   {job.status === 'done' && job.outputUrl && (
                     <a 
                       href={job.outputUrl}
                       download={`converted_${job.file.name.split('.')[0]}.${job.targetFormat}`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                       aria-label={`Download converted ${job.file.name}`}
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

