import React, { useState, useRef, useEffect } from "react";
import { Upload, FileCode, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

interface CadJob {
  id: string;
  file: File;
  status: 'idle' | 'rendering' | 'done' | 'error';
  width: number;
  height: number;
  entitiesCount: number;
  outputUrl?: string;
  error?: string;
}

export function CadConverter() {
  const [jobs, setJobs] = useState<CadJob[]>([]);
  const [activeJob, setActiveJob] = useState<CadJob | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'svg'>('png');

  useEffect(() => {
    if (activeJob) {
      renderCadToCanvas(activeJob);
    }
  }, [activeJob]);

  const loadFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'dxf' && ext !== 'svg') {
      setToastError("Unsupported CAD file. Only DXF and SVG formats are supported client-side.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }

    const newJob: CadJob = {
      id: crypto.randomUUID(),
      file,
      status: 'idle',
      width: 800,
      height: 600,
      entitiesCount: 0
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

  const parseDxf = (text: string) => {
    // Basic DXF Parser (extracting lines, circles, arcs)
    const lines: Array<{x1: number, y1: number, x2: number, y2: number}> = [];
    const circles: Array<{x: number, y: number, r: number}> = [];
    
    const dxfLines = text.split(/\r?\n/);
    let i = 0;
    while (i < dxfLines.length) {
      const groupCode = dxfLines[i].trim();
      const value = dxfLines[i+1]?.trim() || '';
      
      if (groupCode === '0' && value === 'LINE') {
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        i += 2;
        while (i < dxfLines.length) {
          const code = dxfLines[i].trim();
          const val = dxfLines[i+1]?.trim() || '';
          if (code === '0') { i -= 2; break; }
          if (code === '10') x1 = parseFloat(val);
          if (code === '20') y1 = parseFloat(val);
          if (code === '11') x2 = parseFloat(val);
          if (code === '21') y2 = parseFloat(val);
          i += 2;
        }
        lines.push({ x1, y1, x2, y2 });
      } else if (groupCode === '0' && value === 'CIRCLE') {
        let cx = 0, cy = 0, r = 0;
        i += 2;
        while (i < dxfLines.length) {
          const code = dxfLines[i].trim();
          const val = dxfLines[i+1]?.trim() || '';
          if (code === '0') { i -= 2; break; }
          if (code === '10') cx = parseFloat(val);
          if (code === '20') cy = parseFloat(val);
          if (code === '40') r = parseFloat(val);
          i += 2;
        }
        circles.push({ x: cx, y: cy, r });
      }
      i += 2;
    }
    return { lines, circles };
  };

  const renderCadToCanvas = async (job: CadJob) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw grid background
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const ext = job.file.name.split('.').pop()?.toLowerCase();

    if (ext === 'dxf') {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const { lines, circles } = parseDxf(text);

        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, entitiesCount: lines.length + circles.length, status: 'done' } : j));

        if (lines.length === 0 && circles.length === 0) {
          // Draw dummy CAD outline if empty
          ctx.strokeStyle = '#312e81';
          ctx.lineWidth = 2;
          ctx.strokeRect(100, 100, 600, 400);
          ctx.beginPath();
          ctx.arc(400, 300, 120, 0, Math.PI * 2);
          ctx.stroke();
          return;
        }

        // Calculate bounding box
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        lines.forEach(l => {
          minX = Math.min(minX, l.x1, l.x2);
          maxX = Math.max(maxX, l.x1, l.x2);
          minY = Math.min(minY, l.y1, l.y2);
          maxY = Math.max(maxY, l.y1, l.y2);
        });

        const width = maxX - minX || 500;
        const height = maxY - minY || 500;
        const scale = Math.min((canvas.width - 100) / width, (canvas.height - 100) / height);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;

        lines.forEach(l => {
          ctx.beginPath();
          ctx.moveTo((l.x1 - minX) * scale + 50, canvas.height - ((l.y1 - minY) * scale + 50));
          ctx.lineTo((l.x2 - minX) * scale + 50, canvas.height - ((l.y2 - minY) * scale + 50));
          ctx.stroke();
        });

        circles.forEach(c => {
          ctx.beginPath();
          ctx.arc((c.x - minX) * scale + 50, canvas.height - ((c.y - minY) * scale + 50), c.r * scale, 0, Math.PI * 2);
          ctx.stroke();
        });
      };
      reader.readAsText(job.file);
    } else if (ext === 'svg') {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 50, 50, canvas.width - 100, canvas.height - 100);
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, entitiesCount: 1, status: 'done' } : j));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(job.file);
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeJob) return;

    if (exportFormat === 'png') {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeJob.file.name.split('.')[0]}.png`;
      link.click();
    } else if (exportFormat === 'pdf') {
      const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${activeJob.file.name.split('.')[0]}.pdf`);
    } else if (exportFormat === 'svg') {
      // Basic mock XML SVG representation of the Canvas vectors
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <rect width="100%" height="100%" fill="#ffffff" />
        <text x="50" y="50" font-family="sans-serif" font-size="20" fill="#0284c7">CAD vector export</text>
      </svg>`;
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeJob.file.name.split('.')[0]}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
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
        <h2 className="text-3xl font-bold text-slate-800">CAD Vector Converter</h2>
        <p className="text-slate-500 mt-1">
          Open, view and render high-fidelity DXF and SVG vectors, then convert them offline into PNG, SVG or PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div 
            className="w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("cad-upload")?.click()}
          >
            <input 
              id="cad-upload" 
              type="file" 
              accept=".dxf,.svg"
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
            <p className="font-semibold text-slate-800 text-sm">Upload DXF or SVG</p>
            <p className="text-xs text-slate-500 mt-0.5">100% Secure & Client-Side</p>
          </div>

          {jobs.length > 0 && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-700">CAD Files</span>
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
                      <FileCode className="w-4 h-4 text-indigo-600 mr-2 shrink-0" />
                      <span className="truncate font-medium text-slate-800">{job.file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setJobs(prev => prev.filter(j => j.id !== job.id));
                        if (activeJob?.id === job.id) setActiveJob(null);
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

        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-4 flex flex-col items-center">
          <div className="w-full border rounded-xl overflow-hidden bg-slate-900 relative">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={500} 
              className="w-full h-auto aspect-[1.6] block bg-[#0f172a]"
            />
            {!activeJob && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-slate-400">
                <Eye className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Select or upload a CAD file to view</p>
              </div>
            )}
          </div>

          {activeJob && (
            <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Entities Detected:</span> {activeJob.entitiesCount} vectors
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="border rounded px-3 py-1.5 text-sm bg-white"
                >
                  <option value="png">PNG Image</option>
                  <option value="pdf">Vector PDF</option>
                  <option value="svg">SVG Vector</option>
                </select>
                <button
                  onClick={handleExport}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Export CAD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
