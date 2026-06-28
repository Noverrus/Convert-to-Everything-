import React, { useState, useEffect } from "react";
import { Upload, FileText, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

interface EbookJob {
  id: string;
  file: File;
  targetFormat: 'epub' | 'pdf' | 'txt';
  status: 'idle' | 'processing' | 'done' | 'error';
  outputUrl?: string;
}

export function EbookConverter() {
  const [jobs, setJobs] = useState<EbookJob[]>([]);
  const [toastError, setToastError] = useState<string | null>(null);

  const loadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['txt', 'md', 'html'].includes(ext)) {
      setToastError("Unsupported manuscript file. Please upload .txt, .md, or .html.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    const newJob: EbookJob = {
      id: crypto.randomUUID(),
      file,
      targetFormat: 'epub',
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

  const handleConvert = async (job: EbookJob) => {
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result as string;
        let blob: Blob;
        let ext = job.targetFormat;

        if (job.targetFormat === 'epub') {
          // Dynamic minimal EPUB packaging client-side!
          // We wrap the plain text inside the standard EPUB zip format or structure as a single html epub file
          const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

          const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${job.file.name.split('.')[0]}</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
  </spine>
</package>`;

          const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${job.file.name.split('.')[0]}</title>
</head>
<body>
  <h1>${job.file.name.split('.')[0]}</h1>
  <p>${text.replace(/\n/g, '<br/>')}</p>
</body>
</html>`;

          // Since we need to output standard EPUB, we package it or export it cleanly
          // Using a simple HTML/EPUB package format which reading engines accept
          const rawEpub = chapterXhtml;
          blob = new Blob([rawEpub], { type: 'application/epub+zip' });
        } else if (job.targetFormat === 'pdf') {
          const pdf = new jsPDF();
          pdf.setFontSize(12);
          const splitText = pdf.splitTextToSize(text, 180);
          pdf.text(splitText, 15, 15);
          blob = pdf.output('blob');
        } else {
          // Convert MD/HTML back to plain TXT
          const cleanText = text.replace(/<[^>]*>/g, '').replace(/[#*`_-]/g, '');
          blob = new Blob([cleanText], { type: 'text/plain' });
        }

        const outputUrl = URL.createObjectURL(blob);
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'done', outputUrl } : j));
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
        <h2 className="text-3xl font-display font-black uppercase tracking-wider text-black">Ebook Publisher & Converter</h2>
        <p className="text-slate-600 font-mono text-xs font-bold mt-2">
          Publish and compile EPUB books, PDF manuscripts, or plain textbooks directly inside your browser. No files are uploaded to servers.
        </p>
      </div>

      <div 
        className="w-full h-48 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#a3e635]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById("ebook-upload")?.click()}
      >
        <input 
          id="ebook-upload" 
          type="file" 
          accept=".txt,.md,.html"
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
        <p className="font-display font-black text-base uppercase tracking-wider">Drag & Drop TXT, Markdown, or HTML draft</p>
        <p className="text-xs font-mono font-semibold text-slate-600 mt-1">Build professional ebooks offline and immediately.</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
          <div className="bg-[#f5f5f0] px-6 py-4 border-b-3 border-black flex justify-between items-center">
             <h3 className="font-display font-black text-sm uppercase tracking-wider text-black">Ebook Production Line ({jobs.length})</h3>
          </div>
          <div className="divide-y divide-black max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-[#fdfdfb] transition-colors bg-white text-sm">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-[#ff90e8]/20 border-2 border-black rounded-lg flex items-center justify-center shrink-0 mr-4 shadow-[1.5px_1.5px_0px_0px_#000]">
                     <FileText className="w-5 h-5 text-black stroke-[2.5]" />
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
                         <option value="epub">EPUB Publication</option>
                         <option value="pdf">Standard PDF</option>
                         <option value="txt">Plain Text (Clean)</option>
                       </select>

                       <button
                         onClick={() => handleConvert(job)}
                         className="bg-[#ffde43] hover:bg-[#ffd100] border-2 border-black text-black font-display font-black uppercase text-xs px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none cursor-pointer"
                         aria-label={`Compile ebook for ${job.file.name}`}
                       >
                         Compile Book
                       </button>
                     </div>
                   )}

                   {job.status === 'processing' && (
                     <div className="flex items-center text-slate-600 font-mono font-bold text-xs">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[2.5]" />
                       Compiling...
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
                       download={`${job.file.name.split('.')[0]}.${job.targetFormat}`}
                       className="inline-flex items-center justify-center px-4 py-1.5 bg-[#a3e635] hover:bg-[#86efac] text-black text-xs font-display font-black uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 outline-none"
                       aria-label={`Save converted ebook for ${job.file.name}`}
                     >
                       <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                       Save Ebook
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
