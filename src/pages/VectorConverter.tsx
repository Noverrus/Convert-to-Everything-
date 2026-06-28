import React, { useState, useEffect, useRef } from "react";
import { Upload, FileImage, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X } from "lucide-react";
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
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{toastError}</p>
          <button onClick={() => setToastError(null)} className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-slate-800">Vector Rasterizer & Converter</h2>
        <p className="text-slate-500 mt-1">
          Convert high-fidelity SVG vectors into premium raster formats or vector PDF slides offline inside your browser.
        </p>
      </div>

      <div 
        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
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
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-slate-500" />
        </div>
        <p className="font-semibold text-slate-800">Drag & Drop SVG vector file here</p>
        <p className="text-sm text-slate-500 mt-1">Convert cleanly at up to 4x crisp resolution scale factor</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700 font-sans">Rasterization Queue ({jobs.length})</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-slate-50 transition-colors text-sm">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center shrink-0 mr-4">
                     <FileImage className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-slate-900 truncate pr-4">{job.file.name}</p>
                     <p className="text-xs text-slate-500 mt-0.5">Size: {(job.file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <select 
                         value={job.targetFormat}
                         onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, targetFormat: e.target.value as any } : j))}
                         className="border rounded px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                       >
                         <option value="png">PNG Image</option>
                         <option value="jpg">JPEG Image</option>
                         <option value="webp">WEBP Image</option>
                         <option value="pdf">Vector PDF</option>
                       </select>

                       <select 
                         value={job.scale}
                         onChange={(e) => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, scale: Number(e.target.value) } : j))}
                         className="border rounded px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                       >
                         <option value={1}>1x Scale</option>
                         <option value={2}>2x Scale (Crisp)</option>
                         <option value={4}>4x Scale (Ultra-crisp)</option>
                       </select>

                       <button
                         onClick={() => handleConvert(job)}
                         className="bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 transition"
                       >
                         Rasterize
                       </button>
                     </div>
                   )}

                   {job.status === 'rendering' && (
                     <div className="flex items-center text-indigo-600 font-medium text-xs">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Rendering...
                     </div>
                   )}

                   {job.status === 'error' && (
                     <div className="flex items-center text-red-600 text-xs font-medium">
                       <AlertCircle className="w-4 h-4 mr-1.5" />
                       Failed
                     </div>
                   )}

                   {job.status === 'done' && job.outputUrl && (
                     <a 
                       href={job.outputUrl}
                       download={`${job.file.name.split('.')[0]}.${job.targetFormat}`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                     >
                       <Download className="w-4 h-4 mr-1.5" />
                       Save File
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
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
