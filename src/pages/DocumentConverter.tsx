import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, FileText, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { useAutoDelete, formatTimeLeft } from "@/hooks/useAutoDelete";

const SUPPORTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'txt', 'docx', 'html', 'pdf'];

const parseDocxToText = async (file: File): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(file);
    const docXml = await zip.file("word/document.xml")?.async("text");
    if (!docXml) return "No text found in DOCX file.";
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, "application/xml");
    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    let text = "";
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const texts = p.getElementsByTagName("w:t");
      let pText = "";
      for (let j = 0; j < texts.length; j++) {
        pText += texts[j].textContent || "";
      }
      if (pText) {
        text += pText + "\n";
      }
    }
    return text || "No text extracted from DOCX.";
  } catch (err) {
    console.error("Docx parsing error", err);
    return "Failed to parse DOCX content.";
  }
};

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
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<DocJob[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Handle preloaded files from Home Page
  useEffect(() => {
    if (location.state?.preloadedFiles) {
      loadFiles(location.state.preloadedFiles);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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
        } else if (ext === 'html') {
          const rawHtml = await readFileAsText(file);
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(rawHtml, "text/html");
          const text = htmlDoc.body.textContent || htmlDoc.documentElement.textContent || "";
          if (!isFirstPage) {
            pdf.addPage();
          }

          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, pdf.internal.pageSize.getWidth() - 20);
          pdf.text(splitText, 10, 10);
          isFirstPage = false;
        } else if (ext === 'docx') {
          const text = await parseDocxToText(file);
          if (!isFirstPage) {
            pdf.addPage();
          }

          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, pdf.internal.pageSize.getWidth() - 20);
          pdf.text(splitText, 10, 10);
          isFirstPage = false;
        } else if (ext === 'pdf') {
          if (job.files.length === 1) {
            const pdfBlob = file;
            const outputUrl = URL.createObjectURL(pdfBlob);
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done', progress: 100, outputUrl } : j));
            return;
          } else {
            if (!isFirstPage) {
              pdf.addPage();
            }
            pdf.setFontSize(12);
            pdf.text(`[Attached PDF Document: ${file.name}]`, 10, 10);
            isFirstPage = false;
          }
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
        <div className="fixed top-4 right-4 z-50 bg-[#ff5a5f] border-3 border-black text-white px-4 py-3 rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-white mt-0.5 stroke-[2.5]" />
          <p className="text-sm font-display font-black leading-relaxed">{toastError}</p>
          <button onClick={() => setToastError(null)} className="shrink-0 p-1 bg-white hover:bg-slate-100 rounded-lg border-2 border-black ml-auto text-black transition-colors shadow-[1.5px_1.5px_0px_0px_#000]">
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-display font-black uppercase tracking-wide text-black">Document & PDF Converter</h2>
        <p className="text-slate-700 font-mono text-xs font-semibold mt-1">
          📄 Create PDFs from images or text entirely in your browser using Client-Side memory.
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

      <div 
        className="w-full h-48 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#38bdf8]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
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
        <div className="h-16 w-16 bg-[#38bdf8] border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_#000] transition-transform hover:scale-105">
          <Upload className="h-8 w-8 text-black stroke-[2.5]" />
        </div>
        <p className="font-display font-black text-base uppercase tracking-wider text-center px-4">Drag & Drop images or texts to merge into PDF</p>
        <p className="text-xs font-mono font-semibold text-slate-600 mt-1">Accepts JPG, PNG, WEBP, and TXT.</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
           <div className="bg-[#f5f5f0] px-6 py-4 border-b-3 border-black flex justify-between items-center">
             <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">Document Queue ({jobs.length})</h3>
             <button 
               onClick={handleClearAll} 
               className="text-xs font-display font-black uppercase tracking-wider text-[#ff5a5f] bg-red-50 hover:bg-red-100 border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] transition-all cursor-pointer flex items-center font-bold"
             >
                <Trash2 className="w-4 h-4 mr-1 stroke-[2.5]"/> Clear All
             </button>
          </div>
          <div className="divide-y divide-black max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-[#fdfdfb] transition-colors bg-white">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-[#38bdf8]/20 border-2 border-black rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-[1.5px_1.5px_0px_0px_#000]">
                     <FileText className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-bold text-slate-900 truncate pr-4 font-mono text-xs">{job.fileName}.pdf</p>
                     <p className="text-[10px] font-mono text-slate-500 mt-0.5">{job.files.length} items • Engine: jsPDF</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                   {job.status === 'idle' && (
                     <div className="flex items-center gap-2">
                       <button
                         onClick={() => processJob(job.id)}
                         className="bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black text-black font-display font-black uppercase text-xs px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 cursor-pointer"
                       >
                         Merge to PDF
                       </button>
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
                       download={`${job.fileName}.pdf`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95"
                     >
                       <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                       Save PDF
                     </a>
                   )}

                   <button 
                     onClick={() => handleRemove(job.id)}
                     className="p-1.5 text-slate-400 hover:text-[#ff5a5f] border-2 border-transparent hover:border-black hover:bg-red-50 rounded-lg transition-colors ml-2 cursor-pointer"
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
