import React, { useState, useEffect } from "react";
import { Upload, FileText, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { useAutoDelete, formatTimeLeft } from "@/hooks/useAutoDelete";

const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'txt'];

interface DocJob {
  id: string;
  files: File[];
  targetFormat: 'pdf';
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputUrl?: string;
  error?: string;
  fileName: string;
}

export function DocumentConverter() {
  const [jobs, setJobs] = useState<DocJob[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const handleClearAll = () => {
    jobs.forEach(job => {
      if (job.outputUrl) URL.revokeObjectURL(job.outputUrl);
    });
    setJobs([]);
  };

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, timeLeft]);

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
      setToastError("Unsupported format. Only JPG, PNG, WEBP, and TXT files are accepted for PDF conversion.");
      setTimeout(() => setToastError(null), 5000);
    }

    if (validFiles.length > 0) {
      // Group them into a single job as requested by "unified PDF file", or separate if different types?
      // "single unified PDF file" for images, or text to pdf.
      // Let's create a single job for all selected files if they are images.
      const id = crypto.randomUUID();
      const newJob: DocJob = {
        id,
        files: validFiles,
        targetFormat: 'pdf',
        status: 'idle',
        progress: 0,
        fileName: validFiles.length === 1 ? `${validFiles[0].name.split('.')[0]}` : `document_${validFiles.length}_pages`
      };
      setJobs(prev => [...prev, newJob]);
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

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processJob = async (id: string) => {
    setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'processing', progress: 10 } : job));

    try {
      const job = jobs.find(j => j.id === id);
      if (!job) return;

      const pdf = new jsPDF();
      let isFirstPage = true;

      for (let i = 0; i < job.files.length; i++) {
        const file = job.files[i];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 10 + Math.floor((i / job.files.length) * 80) } : j));

        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
          const imgData = await readFileAsDataURL(file);
          
          if (!isFirstPage) {
            pdf.addPage();
          }
          
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // Check if it fits on the page height-wise, and center or scale appropriately
          // Let's just scale to maximum width for simplicity
          pdf.addImage(imgData, ext === 'png' ? 'PNG' : 'JPEG', 0, 0, pdfWidth, pdfHeight);
          isFirstPage = false;
        } else if (ext === 'txt') {
          const text = await readFileAsText(file);
          if (!isFirstPage) {
            pdf.addPage();
          }

          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, pdf.internal.pageSize.getWidth() - 20);
          pdf.text(splitText, 10, 10);
          isFirstPage = false;
        }
      }

      setJobs(prev => prev.map(j => j.id === id ? { ...j, progress: 95 } : j));

      const pdfBlob = pdf.output('blob');
      const outputUrl = URL.createObjectURL(pdfBlob);

      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done', progress: 100, outputUrl } : j));

    } catch (err: any) {
      console.error(err);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'error', error: "Failed to generate PDF." } : j));
    }
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
        <h2 className="text-3xl font-bold text-slate-800">Document & PDF Converter</h2>
        <p className="text-slate-500 mt-1">
          Create PDFs from images or text entirely in your browser using Client-Side memory.
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
        onClick={() => document.getElementById("doc-upload")?.click()}
      >
        <input 
          id="doc-upload" 
          type="file" 
          multiple 
          accept=".jpg,.jpeg,.png,.webp,.txt"
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
        <p className="font-semibold text-slate-800">Drag & Drop images or texts to merge into PDF</p>
        <p className="text-sm text-slate-500 mt-1">Accepts JPG, PNG, WEBP, and TXT.</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700">Document Queue ({jobs.length})</h3>
             <button onClick={handleClearAll} className="text-sm text-red-600 hover:text-red-700 flex items-center">
                <Trash2 className="w-4 h-4 mr-1"/> Clear All
             </button>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center shrink-0 mr-4">
                     <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-medium text-slate-900 truncate pr-4">{job.fileName}.pdf</p>
                     <p className="text-xs text-slate-500 mt-0.5">{job.files.length} items • Engine: jsPDF</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <button
                         onClick={() => processJob(job.id)}
                         className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition"
                       >
                         Merge to PDF
                       </button>
                     </div>
                   )}

                   {job.status === 'processing' && (
                     <div className="flex items-center text-indigo-600 font-medium text-sm">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       {job.progress}%
                     </div>
                   )}

                   {job.status === 'error' && (
                     <div className="flex items-center text-red-600 text-sm font-medium" title={job.error}>
                       <AlertCircle className="w-4 h-4 mr-1.5" />
                       Failed
                     </div>
                   )}

                   {job.status === 'done' && job.outputUrl && (
                     <a 
                       href={job.outputUrl}
                       download={`${job.fileName}.pdf`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                     >
                       <Download className="w-4 h-4 mr-1.5" />
                       Save PDF
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
