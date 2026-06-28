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
        <h2 className="text-3xl font-display font-black uppercase tracking-wider text-black">Font Engine & CSS Packager</h2>
        <p className="text-slate-600 font-mono text-xs font-bold mt-2">
          Upload any TTF, OTF, or WOFF font to preview typography dynamically and package standard integration CSS offline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div 
            className="w-full h-40 border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center hover:bg-[#a3e635]/5 bg-white text-black cursor-pointer shadow-[4px_4px_0px_0px_#000] transition-all"
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
            <div className="h-10 w-10 bg-[#ffde43] border-2 border-black rounded-lg flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_#000]">
              <Upload className="h-5 w-5 text-black stroke-[2.5]" />
            </div>
            <p className="font-display font-black text-sm uppercase tracking-wide">Upload TTF, OTF, WOFF</p>
            <p className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">Local live rendering engine</p>
          </div>

          {jobs.length > 0 && (
            <div className="bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <div className="bg-[#f5f5f0] px-4 py-3 border-b-3 border-black flex justify-between items-center">
                <span className="font-display font-black text-xs uppercase tracking-wider text-black">Fonts Uploaded</span>
              </div>
              <div className="divide-y divide-black max-h-[300px] overflow-y-auto">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    onClick={() => setActiveJob(job)}
                    className={cn(
                      "p-3 flex items-center justify-between cursor-pointer transition-colors text-sm",
                      activeJob?.id === job.id ? "bg-[#ff90e8]/20" : "hover:bg-[#fdfdfb]"
                    )}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Type className="w-4 h-4 text-black stroke-[2.5] mr-2 shrink-0" />
                      <span className="truncate font-mono font-bold text-xs text-slate-800">{job.file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobs(prev => prev.filter(j => j.id !== job.id));
                        if (activeJob?.id === job.id) setActiveJob(null);
                        if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
                      }}
                      className="p-1 text-slate-400 hover:text-[#ff5a5f] border-2 border-transparent hover:border-black hover:bg-red-50 rounded-lg transition-colors ml-2 focus-visible:ring-2 focus-visible:ring-black outline-none"
                      aria-label={`Remove font ${job.file.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_#000] p-6 flex flex-col space-y-6">
          {activeJob ? (
            <>
              <div>
                <h4 className="font-display font-black uppercase text-sm tracking-wide text-black">Font Face Web Preview</h4>
                <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">Active family: {activeJob.file.name.split('.')[0]}</p>
              </div>

              <input 
                type="text" 
                value={sampleText} 
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full border-2 border-black rounded-lg p-3 outline-none focus-visible:ring-2 focus-visible:ring-black font-mono font-semibold text-xs bg-white"
                placeholder="Type sample text here..."
                aria-label="Font sample preview text input"
              />

              <div className="border-3 border-black rounded-xl p-6 bg-[#fdfdfb] min-h-[150px] flex items-center justify-center text-center shadow-[2px_2px_0px_0px_#000]">
                <p 
                  style={{ fontFamily: activeJob.fontName }} 
                  className="text-4xl leading-relaxed text-black break-words w-full"
                >
                  {sampleText}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-display font-black uppercase text-xs text-black">Integration CSS (@font-face)</h5>
                  <button 
                    onClick={() => handleDownloadCSS(activeJob)}
                    className="text-xs font-display font-black uppercase tracking-wider text-black bg-[#a3e635] hover:bg-[#86efac] border-2 border-black px-3 py-1.5 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] active:scale-95 focus-visible:ring-2 focus-visible:ring-black outline-none cursor-pointer flex items-center"
                    aria-label="Save integration CSS file"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" /> Save CSS File
                  </button>
                </div>
                <pre className="bg-slate-950 text-slate-200 p-4 border-3 border-black rounded-xl font-mono text-xs overflow-x-auto select-all max-h-[150px] shadow-[2px_2px_0px_0px_#000]">
                  {activeJob.cssCode}
                </pre>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <Type className="w-12 h-12 mb-3 text-black stroke-[1.5] opacity-40" />
              <p className="text-xs font-mono font-bold text-slate-600">Select or upload a TTF/OTF font file to start dynamic previews</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
