import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, FileImage, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

interface VectorJob {
  id: string;
  file: File;
  targetFormat: 'png' | 'jpg' | 'webp' | 'pdf';
  scale: number;
  status: 'idle' | 'rendering' | 'done' | 'error';
  outputUrl?: string;
}

export function VectorConverter() {
  const [jobs, setJobs] = useState<VectorJob[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'svg') {
      setToastError("Unsupported vector file. Only .svg formats can be rasterized.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    const newJob: VectorJob = {
      id: crypto.randomUUID(),
      file,
      targetFormat: 'png',
      scale: 2,
      status: 'idle'
    };
    setJobs(prev => [...prev, newJob]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async (job: VectorJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'rendering' } : j));

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const svgContent = reader.result as string;
        
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current || document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Render at larger resolution scale for crispness
          const width = img.width || 400;
          const height = img.height || 400;
          canvas.width = width * job.scale;
          canvas.height = height * job.scale;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw image scaled
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let outputUrl = "";
          if (job.targetFormat === 'pdf') {
            const pdf = new jsPDF(canvas.width > canvas.height ? 'l' : 'p', 'px', [canvas.width, canvas.height]);
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
            const pdfBlob = pdf.output('blob');
            outputUrl = URL.createObjectURL(pdfBlob);
          } else {
            const mime = `image/${job.targetFormat === 'jpg' ? 'jpeg' : job.targetFormat}`;
            outputUrl = canvas.toDataURL(mime);
          }

          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', outputUrl } : j));
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
      };
      reader.readAsText(job.file);
    } catch (err) {
      console.error(err);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error' } : j));
    }
  };

  const handleRemove = (id: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (job?.outputUrl && job.outputUrl.startsWith('blob:')) URL.revokeObjectURL(job.outputUrl);
      return prev.filter(j => j.id !== id);
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 relative">
      {toastError && (
        <div className="fixed top-4 right-4 z-50 bg-[#ff5a5f] border-3 border-black text-black px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md font-mono text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-black stroke-[2.5] mt-0.5" />
          <p className="leading-relaxed">{toastError}</p>
          <button onClick={() => setToastError(null)} className="shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors ml-auto">
            <X className="w-4 h-4 text-black stroke-[2.5]" />
          </button>
        </div>
      )}

      <div className="border-3 border-black bg-white p-6 sm:p-8 rounded-xl shadow-[6px_6px_0px_0px_#000]">
        <h2 className="text-3xl font-display font-black uppercase tracking-wider text-black">Vector Rasterizer & Converter</h2>
        <p className="text-slate-600 font-mono text-xs font-bold mt-2">
          Convert high-fidelity SVG vectors into premium raster formats or vector PDF slides offline inside your browser. No files are uploaded to servers.
        </p>
      </div>

      <div 
        className="w-full h-48 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#60a5fa]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("vector-upload")?.click()}
      >
        <input 
          id="vector-upload" 
          type="file" 
          accept=".svg"
          className="hidden" 
          onChange={(e) => {
            if (e.target.files?.[0]) {
              loadFile(e.target.files[0]);
            }
          }}
        />
        <div className="h-16 w-16 bg-[#ffde43] border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_#000] transition-transform hover:scale-105">
          <Upload className="h-8 w-8 text-black stroke-[2.5]" />
        </div>
        <p className="font-display font-black text-base uppercase tracking-wider">Drag & Drop SVG vector file here</p>
        <p className="text-xs font-mono font-semibold text-slate-600 mt-1">Convert cleanly at up to 4x crisp resolution scale factor</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
          <div className="bg-[#f5f5f0] px-6 py-4 border-b-3 border-black flex justify-between items-center">
             <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">Rasterization Queue ({jobs.length})</h3>
          </div>
          <div className="divide-y divide-black max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-[#fdfdfb] transition-colors bg-white text-sm">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-[#60a5fa]/20 border-2 border-black rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-[1.5px_1.5px_0px_0px_#000]">
                     <FileImage className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-bold text-slate-900 truncate pr-4 font-mono text-xs">{job.file.name}</p>
                     <p className="text-[10px] font-mono text-slate-500 mt-0.5">Size: {(job.file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <select 
                         value={job.targetFormat}
                         onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, targetFormat: e.target.value as any } : j))}
                         className="border-2 border-black rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus-visible:ring-2 focus-visible:ring-black outline-none"
                         aria-label={`Format for ${job.file.name}`}
                       >
                         <option value="png">PNG Image</option>
                         <option value="jpg">JPEG Image</option>
                         <option value="webp">WEBP Image</option>
                         <option value="pdf">Vector PDF</option>
                       </select>

                       <select 
                         value={job.scale}
                         onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, scale: Number(e.target.value) } : j))}
                         className="border-2 border-black rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white focus-visible:ring-2 focus-visible:ring-black outline-none"
                         aria-label={`Scale for ${job.file.name}`}
                       >
                         <option value={1}>1x Scale</option>
                         <option value={2}>2x Scale (Crisp)</option>
                         <option value={4}>4x Scale (Ultra-crisp)</option>
                       </select>

                       <button
                         onClick={() => handleConvert(job)}
                         className="bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black text-black font-display font-black uppercase text-xs px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none cursor-pointer"
                       >
                         Rasterize
                       </button>
                     </div>
                   )}

                   {job.status === 'rendering' && (
                     <div className="flex items-center text-indigo-600 font-mono font-bold text-xs">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[2.5]" />
                       Rendering...
                     </div>
                   )}

                   {job.status === 'error' && (
                     <div className="flex items-center text-[#ff5a5f] text-xs font-mono font-bold">
                       <AlertCircle className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                       Failed
                     </div>
                   )}

                   {job.status === 'done' && job.outputUrl && (
                     <div className="flex items-center gap-2">
                       {job.targetFormat === "pdf" && (
                         <Link
                           to="/pdf-viewer"
                           state={{ pdfUrl: job.outputUrl, fileName: `${job.file.name.split('.')[0]}.pdf` }}
                           className="inline-flex items-center justify-center px-4 py-1.5 bg-[#ffde43] hover:bg-[#ffd100] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95"
                         >
                           <Eye className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                           Preview
                         </Link>
                       )}
                       <a 
                         href={job.outputUrl}
                         download={`${job.file.name.split('.')[0]}.${job.targetFormat}`}
                         className="inline-flex items-center justify-center px-4 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                       >
                         <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                         Save File
                       </a>
                     </div>
                   )}

                   <button 
                     onClick={() => handleRemove(job.id)}
                     className="p-1.5 text-slate-400 hover:text-[#ff5a5f] border-2 border-transparent hover:border-black hover:bg-red-50 rounded-lg transition-colors ml-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-black outline-none"
                   >
                     <Trash2 className="w-4 h-4 stroke-[2.5]" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
