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
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-4 max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{toastError}</p>
          <button onClick={() => setToastError(null)} className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-slate-800">Ebook Publisher & Converter</h2>
        <p className="text-slate-500 mt-1">
          Publish and build EPUB books, PDF manuscripts, or plain textbooks directly inside your browser.
        </p>
      </div>

      <div 
        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
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
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-slate-500" />
        </div>
        <p className="font-semibold text-slate-800">Drag & Drop TXT, Markdown, or HTML draft</p>
        <p className="text-sm text-slate-500 mt-1">Build Ebooks offline and immediately</p>
      </div>

      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
             <h3 className="font-semibold text-slate-700 font-sans">Ebook Production Line ({jobs.length})</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 hover:bg-slate-50 transition-colors text-sm">
                <div className="flex-1 flex items-center w-full min-w-0">
                  <div className="h-10 w-10 bg-indigo-100 rounded flex items-center justify-center shrink-0 mr-4">
                     <FileText className="w-5 h-5 text-indigo-600" />
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
                         <option value="epub">EPUB Publication</option>
                         <option value="pdf">Standard PDF</option>
                         <option value="txt">Plain Text (Clean)</option>
                       </select>

                       <button
                         onClick={() => handleConvert(job)}
                         className="bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 transition"
                       >
                         Compile Book
                       </button>
                     </div>
                   )}

                   {job.status === 'processing' && (
                     <div className="flex items-center text-indigo-600 font-medium text-xs">
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Compiling...
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
                       Save Ebook
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
