import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Upload, FileText, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Eye } from "lucide-react";
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
    
    // Simple regex to extract text content from word xml elements
    const matches = docXml.match(/<w:t.*?>(.*?)<\/w:t>/g) || [];
    return matches.map(val => val.replace(/<w:t.*?>/, "").replace(/<\/w:t>/, "")).join(" ");
  } catch (err) {
    console.error("Error reading DOCX:", err);
    return "Error parsing DOCX file.";
  }
};

interface DocumentJob {
  id: string;
  file: File;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  outputUrl?: string;
  fileName: string;
  error?: string;
}

export function DocumentConverter() {
  const [jobs, setJobs] = useState<DocumentJob[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);

  const loadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setToastError(`Unsupported file extension: .${ext}. We only support PNG, JPG, WEBP, TXT, DOCX, HTML, and PDF.`);
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newJob: DocumentJob = {
      id: crypto.randomUUID(),
      file,
      status: 'idle',
      progress: 0,
      fileName: baseName
    };
    setJobs(prev => [...prev, newJob]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => loadFile(file as File));
    }
  };

  const handleConvert = async (job: DocumentJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing', progress: 10 } : j));

    try {
      const ext = job.file.name.split('.').pop()?.toLowerCase() || '';
      
      if (ext === 'pdf') {
        // PDF to PDF simply clones or wraps. Since we process offline in memory,
        // we read the file into an ArrayBuffer and construct a clean output blob URL.
        const reader = new FileReader();
        reader.onload = () => {
          const blob = new Blob([reader.result as ArrayBuffer], { type: 'application/pdf' });
          const outputUrl = URL.createObjectURL(blob);
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', progress: 100, outputUrl } : j));
        };
        reader.readAsArrayBuffer(job.file);
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        // Image conversion to PDF
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            // Calculate scale ratio to fit standard A4 paper sizes
            const imgWidth = img.width;
            const imgHeight = img.height;
            const widthRatio = contentWidth / imgWidth;
            const heightRatio = contentHeight / imgHeight;
            const scale = Math.min(widthRatio, heightRatio);

            const renderWidth = imgWidth * scale;
            const renderHeight = imgHeight * scale;
            const xOffset = margin + (contentWidth - renderWidth) / 2;
            const yOffset = margin + (contentHeight - renderHeight) / 2;

            pdf.addImage(reader.result as string, ext.toUpperCase() === 'JPG' ? 'JPEG' : ext.toUpperCase(), xOffset, yOffset, renderWidth, renderHeight);
            
            const pdfBlob = pdf.output('blob');
            const outputUrl = URL.createObjectURL(pdfBlob);
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', progress: 100, outputUrl } : j));
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(job.file);
      } else {
        // Textual document formats (TXT, DOCX, HTML)
        let docText = "";
        if (ext === 'docx') {
          docText = await parseDocxToText(job.file);
        } else {
          // TXT or HTML
          const reader = new FileReader();
          const readPromise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const raw = reader.result as string;
              if (ext === 'html') {
                // Strip tags for clean PDF generation representation
                resolve(raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
              } else {
                resolve(raw);
              }
            };
            reader.readAsText(job.file);
          });
          docText = await readPromise;
        }

        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(11);
        
        const splitLines = pdf.splitTextToSize(docText, contentWidth);
        let yCursor = margin;

        splitLines.forEach((line: string) => {
          if (yCursor + 7 > pageHeight - margin) {
            pdf.addPage();
            yCursor = margin;
          }
          pdf.text(line, margin, yCursor);
          yCursor += 6;
        });

        const pdfBlob = pdf.output('blob');
        const outputUrl = URL.createObjectURL(pdfBlob);
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', progress: 100, outputUrl } : j));
      }

    } catch (err: any) {
      console.error("Document conversion error:", err);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', error: err.message || "Conversion failed." } : j));
    }
  };

  const handleRemove = (id: string) => {
    setJobs(prev => {
      const job = prev.find(j => j.id === id);
      if (job?.outputUrl) URL.revokeObjectURL(job.outputUrl);
      return prev.filter(j => j.id !== id);
    });
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
        <h2 className="text-3xl font-display font-black uppercase tracking-wider text-black">Document to PDF Compiler</h2>
        <p className="text-slate-600 font-mono text-xs font-bold mt-2">
          Compile multiple image scans, plain text manuscripts, Word DOCX files, HTML snippets or PDF pages into pristine PDF documents directly inside your browser.
        </p>
      </div>

      <div 
        className="w-full h-48 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#38bdf8]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("document-upload")?.click()}
      >
        <input 
          id="document-upload" 
          type="file" 
          multiple
          accept=".png,.jpg,.jpeg,.webp,.txt,.docx,.html,.pdf"
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              Array.from(e.target.files).forEach(file => loadFile(file as File));
            }
          }}
        />
        <div className="h-16 w-16 bg-[#ffde43] border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_#000] transition-transform hover:scale-105">
          <Upload className="h-8 w-8 text-black stroke-[2.5]" />
        </div>
        <p className="font-display font-black text-base uppercase tracking-wider">Drag & Drop documents here</p>
        <p className="text-xs font-mono font-semibold text-slate-600 mt-1">PNG, JPG, WEBP, TXT, DOCX, HTML, PDF files supported</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
          <div className="bg-[#f5f5f0] px-6 py-4 border-b-3 border-black flex justify-between items-center">
             <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">Compilation Queue ({jobs.length})</h3>
          </div>
          <div className="divide-y divide-black max-h-[500px] overflow-y-auto bg-white">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-[#fdfdfb] transition-colors text-sm">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-[#38bdf8]/20 border-2 border-black rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-[1.5px_1.5px_0px_0px_#000]">
                     <FileText className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="font-bold text-slate-900 truncate pr-4 font-mono text-xs">{job.file.name}</p>
                     <p className="text-[10px] font-mono text-slate-500 mt-0.5">Size: {(job.file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                    {job.status === 'idle' && (
                      <button
                        onClick={() => handleConvert(job)}
                        className="bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black text-black font-display font-black uppercase text-xs px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 cursor-pointer"
                      >
                        Compile to PDF
                      </button>
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
                      <div className="flex items-center gap-2">
                        <Link
                          to="/pdf-viewer"
                          state={{ pdfUrl: job.outputUrl, fileName: `${job.fileName}.pdf` }}
                          className="inline-flex items-center justify-center px-4 py-1.5 bg-[#ffde43] hover:bg-[#ffd100] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95"
                        >
                          <Eye className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                          Preview
                        </Link>
                        <a 
                          href={job.outputUrl}
                          download={`${job.fileName}.pdf`}
                          className="inline-flex items-center justify-center px-4 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95"
                        >
                          <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                          Save PDF
                        </a>
                      </div>
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
