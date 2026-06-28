import React, { useState, useEffect } from "react";
import { Upload, Type, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface FontJob {
  id: string;
  file: File;
  fontName: string;
  status: 'idle' | 'rendering' | 'done' | 'error';
  cssCode?: string;
  previewUrl?: string;
}

export function FontConverter() {
  const [jobs, setJobs] = useState<FontJob[]>([]);
  const [activeJob, setActiveJob] = useState<FontJob | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState("Pack my box with five dozen liquor jugs.");

  useEffect(() => {
    if (activeJob && activeJob.previewUrl) {
      // Dynamic loading of font into browser page completely offline!
      const fontFace = new FontFace(activeJob.fontName, `url(${activeJob.previewUrl})`);
      fontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
      }).catch((err) => {
        console.error("Failed to load font face client-side:", err);
      });
    }
  }, [activeJob]);

  const loadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'ttf' && ext !== 'otf' && ext !== 'woff' && ext !== 'woff2') {
      setToastError("Unsupported font format. Upload TTF, OTF, WOFF, or WOFF2.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    const fontName = `CustomFont_${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);

    const cssCode = `@font-face {
  font-family: '${file.name.split('.')[0]}';
  src: url('${file.name}') format('${ext === 'otf' ? 'opentype' : ext}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;

    const newJob: FontJob = {
      id: crypto.randomUUID(),
      file,
      fontName,
      status: 'done',
      cssCode,
      previewUrl
    };

    setJobs(prev => [...prev, newJob]);
    setActiveJob(newJob);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadCSS = (job: FontJob) => {
    if (!job.cssCode) return;
    const blob = new Blob([job.cssCode], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${job.file.name.split('.')[0]}_fontface.css`;
    link.click();
    URL.revokeObjectURL(url);
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
        <h2 className="text-3xl font-bold text-slate-800">Font Engine & CSS Packager</h2>
        <p className="text-slate-500 mt-1">
          Upload any TTF, OTF, or WOFF font to preview typography dynamically and package standard integration CSS offline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div 
            className="w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("font-upload")?.click()}
          >
            <input 
              id="font-upload" 
              type="file" 
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  loadFile(e.target.files[0]);
                }
              }}
            />
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <Upload className="h-5 w-5 text-slate-500" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">Upload TTF, OTF, WOFF</p>
            <p className="text-xs text-slate-500 mt-0.5">Local live rendering engine</p>
          </div>

          {jobs.length > 0 && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-700">Fonts Uploaded</span>
              </div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => setActiveJob(job)}
                    className={cn(
                      "p-3 flex items-center justify-between cursor-pointer transition-colors text-sm",
                      activeJob?.id === job.id ? "bg-indigo-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Type className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
                      <span className="truncate font-medium text-slate-800">{job.file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobs(prev => prev.filter(j => j.id !== job.id));
                        if (activeJob?.id === job.id) setActiveJob(null);
                        if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6 flex flex-col space-y-6">
          {activeJob ? (
            <>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Font Face Web Preview</h4>
                <p className="text-xs text-slate-500 mt-0.5">Active family: {activeJob.file.name.split('.')[0]}</p>
              </div>

              <input 
                type="text" 
                value={sampleText} 
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                placeholder="Type sample text here..."
              />

              <div className="border rounded-2xl p-6 bg-slate-50 min-h-[150px] flex items-center justify-center text-center">
                <p 
                  style={{ fontFamily: activeJob.fontName }} 
                  className="text-4xl leading-relaxed text-slate-900 break-words w-full"
                >
                  {sampleText}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-slate-700 text-sm">Integration CSS (@font-face)</h5>
                  <button 
                    onClick={() => handleDownloadCSS(activeJob)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Save CSS File
                  </button>
                </div>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto select-all max-h-[150px]">
                  {activeJob.cssCode}
                </pre>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <Type className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Select or upload a TTF/OTF font file to start dynamic previews</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
