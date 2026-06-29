import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  Menu, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, 
  Download, Printer, FileText, Loader2, AlertCircle, Upload, List, BookOpen,
  ArrowLeft, Eye, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFOutlineItem {
  title: string;
  dest: any;
  items: PDFOutlineItem[];
}

export function DocumentViewer() {
  const location = useLocation();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"thumbnails" | "outline">("thumbnails");
  const [outline, setOutline] = useState<PDFOutlineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [pageViews, setPageViews] = useState<{ [key: number]: string }>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check router state for passed files
  useEffect(() => {
    if (location.state?.pdfUrl) {
      setPdfUrl(location.state.pdfUrl);
      setFileName(location.state.fileName || "Converted_Document.pdf");
    }
  }, [location.state]);

  // Handle URL loading and rendering
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      setLoading(true);
      setLoadingProgress(10);
      setError(null);
      setOutline([]);
      setPageViews({});
      setNumPages(0);
      setCurrentPage(1);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false
        });

        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            setLoadingProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        };

        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoadingProgress(90);

        // Fetch outline (TOC)
        try {
          const docOutline = await doc.getOutline();
          if (docOutline) {
            setOutline(docOutline);
          }
        } catch (e) {
          console.warn("Failed to retrieve PDF outline:", e);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("PDF loading error:", err);
        setError("Unable to render PDF. It might be password-protected or corrupted.");
        setLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Set up intersection observer to detect current page in scroll
  useEffect(() => {
    if (!numPages) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute("data-page") || "1");
            setCurrentPage(pageNum);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.3, // Page is active when 30% visible
      }
    );

    Object.values(pageRefs.current).forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [numPages, zoomScale, loading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setFileName(file.name);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(file));
    } else if (file) {
      setError("Please select a valid PDF document.");
    }
  };

  const handleFilesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setFileName(file.name);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(file));
    } else if (file) {
      setError("Please drop a valid PDF document.");
    }
  };

  const zoomIn = () => setZoomScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setZoomScale(prev => Math.max(prev - 0.2, 0.4));
  const zoomReset = () => setZoomScale(1.0);

  const fitToWidth = () => {
    if (!pdfDoc || !containerRef.current) return;
    pdfDoc.getPage(currentPage).then((page: any) => {
      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = containerRef.current!.clientWidth - 48; // padding
      const newScale = containerWidth / viewport.width;
      setZoomScale(newScale);
    });
  };

  const fitToHeight = () => {
    if (!pdfDoc || !containerRef.current) return;
    pdfDoc.getPage(currentPage).then((page: any) => {
      const viewport = page.getViewport({ scale: 1.0 });
      const containerHeight = containerRef.current!.clientHeight - 48; // padding
      const newScale = containerHeight / viewport.height;
      setZoomScale(newScale);
    });
  };

  const scrollToPage = (pageNum: number) => {
    const element = pageRefs.current[pageNum];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(pageNum);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };

  // Render individual page thumbnail in sidebar
  const Thumbnail = ({ pageNum }: { pageNum: number, key?: React.Key }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
      if (!pdfDoc || !canvasRef.current || rendered) return;

      const renderThumbnail = async () => {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.18 }); // 10% scale for thumbnail
          const canvas = canvasRef.current;
          if (!canvas) return;
          const context = canvas.getContext("2d");
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
          setRendered(true);
        } catch (e) {
          console.error("Error rendering thumbnail:", e);
        }
      };

      renderThumbnail();
    }, [pdfDoc, pageNum, rendered]);

    return (
      <button
        onClick={() => scrollToPage(pageNum)}
        className={cn(
          "w-full flex flex-col items-center p-3 rounded-lg border-2 transition-all active:scale-95 group hover:bg-[#ffde43]/10 cursor-pointer",
          currentPage === pageNum 
            ? "border-black bg-[#ffde43]/20 shadow-[2px_2px_0px_0px_#000]" 
            : "border-transparent text-slate-700 hover:border-black"
        )}
      >
        <div className="border border-black bg-white rounded overflow-hidden shadow-[1px_1px_0px_0px_#000] mb-1.5 group-hover:shadow-[2px_2px_0px_0px_#000] transition-all">
          <canvas ref={canvasRef} />
        </div>
        <span className="font-mono text-[10px] font-black">Page {pageNum}</span>
      </button>
    );
  };

  // Render main scrollable PDF pages
  const PDFPage = ({ pageNum }: { pageNum: number, key?: React.Key }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
      if (!pdfDoc || !canvasRef.current) return;

      let renderTask: any = null;

      const renderPage = async () => {
        try {
          setPageLoading(true);
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: zoomScale });
          const canvas = canvasRef.current;
          if (!canvas) return;
          const context = canvas.getContext("2d");
          if (!context) return;

          // Support high-DPI displays
          const dpr = window.devicePixelRatio || 1;
          canvas.height = viewport.height * dpr;
          canvas.width = viewport.width * dpr;
          canvas.style.height = `${viewport.height}px`;
          canvas.style.width = `${viewport.width}px`;
          context.scale(dpr, dpr);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          renderTask = page.render(renderContext);
          await renderTask.promise;
          setPageLoading(false);
        } catch (e: any) {
          if (e.name !== "RenderingCancelledException") {
            console.error("Error rendering page:", e);
          }
        }
      };

      renderPage();

      return () => {
        if (renderTask) {
          renderTask.cancel();
        }
      };
    }, [pdfDoc, pageNum, zoomScale]);

    return (
      <div
        ref={(el) => { pageRefs.current[pageNum] = el; }}
        data-page={pageNum}
        className="relative bg-white border-3 border-black rounded-xl p-3 shadow-[5px_5px_0px_0px_#000] flex justify-center items-center select-none"
        style={{ minWidth: "100px", minHeight: "200px" }}
      >
        {pageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg">
            <Loader2 className="w-8 h-8 text-black animate-spin stroke-[2.5]" />
          </div>
        )}
        <canvas ref={canvasRef} className="block" />
        <span className="absolute bottom-2 right-4 font-mono font-bold text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
          {pageNum} / {numPages}
        </span>
      </div>
    );
  };

  const renderOutlineItems = (items: PDFOutlineItem[], depth = 0) => {
    return (
      <ul className={cn("space-y-1", depth > 0 && "ml-3 pl-2.5 border-l-2 border-slate-200")}>
        {items.map((item, idx) => (
          <li key={idx} className="space-y-1">
            <button
              onClick={() => {
                // If dest is a page ref or string, resolve it and scroll
                if (item.dest) {
                  if (typeof item.dest === "string") {
                    pdfDoc.getDestination(item.dest).then((resolvedDest: any) => {
                      if (resolvedDest) {
                        pdfDoc.getPageIndex(resolvedDest[0]).then((pageIndex: number) => {
                          scrollToPage(pageIndex + 1);
                        });
                      }
                    });
                  } else if (Array.isArray(item.dest) && item.dest[0]) {
                    pdfDoc.getPageIndex(item.dest[0]).then((pageIndex: number) => {
                      scrollToPage(pageIndex + 1);
                    });
                  }
                }
              }}
              className="text-left w-full font-display font-bold text-xs hover:text-[#38bdf8] truncate py-1 text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{item.title}</span>
            </button>
            {item.items && item.items.length > 0 && renderOutlineItems(item.items, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-[#f5f5f0]">
      {!pdfUrl ? (
        /* PDF Upload Dashboard */
        <div className="max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-8 flex flex-col justify-center flex-1">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-black uppercase tracking-wide text-black">
              Interactive PDF & Document Viewer
            </h2>
            <p className="text-slate-700 font-mono text-xs font-semibold max-w-lg mx-auto">
              📂 Drag and drop any PDF file to view it with fully featured interactive outlines, thumbnails, and precise zoom controls.
            </p>
          </div>

          <div 
            className="w-full h-64 border-3 border-dashed border-black rounded-2xl flex flex-col items-center justify-center hover:bg-[#ffde43]/5 bg-white text-black cursor-pointer shadow-[5px_5px_0px_0px_#000] transition-all"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFilesDrop}
            onClick={() => document.getElementById("pdf-viewer-upload")?.click()}
          >
            <input 
              id="pdf-viewer-upload" 
              type="file" 
              accept=".pdf"
              className="hidden" 
              onChange={handleFileUpload}
            />
            <div className="h-20 w-20 bg-[#ffde43] border-2 border-black rounded-2xl flex items-center justify-center mb-6 shadow-[3px_3px_0px_0px_#000] transition-transform hover:scale-105">
              <Upload className="h-10 w-10 text-black stroke-[2.5]" />
            </div>
            <p className="font-display font-black text-lg uppercase tracking-wider text-center px-4">
              Select or Drop PDF File to open
            </p>
            <p className="text-xs font-mono font-semibold text-slate-500 mt-2">Max file size up to 100MB • SECURED LOCAL SANDBOX</p>
          </div>

          {error && (
            <div className="bg-[#ff5a5f] border-3 border-black text-white p-4 rounded-xl shadow-[4px_4px_0px_0px_#000] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-white mt-0.5 stroke-[2.5]" />
              <p className="text-sm font-display font-black leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      ) : (
        /* PDF Reader Workspace Layout */
        <div className="flex-1 flex flex-col md:flex-row min-h-0 border-3 border-black rounded-2xl bg-white shadow-[6px_6px_0px_0px_#000] overflow-hidden m-2 sm:m-4">
          
          {/* LEFT SIDEBAR - Interactive Outline and Thumbnails */}
          {sidebarOpen && (
            <aside className="w-full md:w-64 border-b-3 md:border-b-0 md:border-r-3 border-black bg-white flex flex-col h-72 md:h-auto shrink-0 z-10">
              {/* Tab Switcher - Beautiful Brutalist buttons */}
              <div className="grid grid-cols-2 border-b-3 border-black shrink-0 p-1.5 gap-1.5 bg-[#f5f5f0]">
                <button
                  onClick={() => setActiveTab("thumbnails")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 border-2 text-xs font-display font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer",
                    activeTab === "thumbnails"
                      ? "bg-[#38bdf8] border-black text-black shadow-[2px_2px_0px_0px_#000]"
                      : "bg-white border-transparent text-slate-700 hover:border-black hover:bg-slate-100"
                  )}
                >
                  <List className="w-4 h-4 stroke-[2.5]" />
                  Pages
                </button>
                <button
                  onClick={() => setActiveTab("outline")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 px-3 border-2 text-xs font-display font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer",
                    activeTab === "outline"
                      ? "bg-[#ff90e8] border-black text-black shadow-[2px_2px_0px_0px_#000]"
                      : "bg-white border-transparent text-slate-700 hover:border-black hover:bg-slate-100"
                  )}
                >
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                  Outline
                </button>
              </div>

              {/* Sidebar Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 min-h-0">
                {activeTab === "thumbnails" ? (
                  /* Pages / Thumbnails Tab */
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    {Array.from({ length: numPages }).map((_, i) => (
                      <Thumbnail key={i} pageNum={i + 1} />
                    ))}
                  </div>
                ) : (
                  /* Outline / Table of Contents Tab */
                  <div className="space-y-2">
                    {outline.length > 0 ? (
                      renderOutlineItems(outline)
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-mono font-semibold text-slate-500 leading-normal">
                          Outline is not available for this document.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* MAIN PAGE AREA & TOOLBAR */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Top Toolbar */}
            <div className="bg-[#ffde43] border-b-3 border-black h-16 px-4 flex items-center justify-between font-mono text-xs shadow-sm z-20 shrink-0">
              <div className="flex items-center space-x-2.5">
                {/* Close/Back Button */}
                <button 
                  onClick={() => {
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(null);
                    setPdfDoc(null);
                    setPdfFile(null);
                  }}
                  className="bg-white border-2 border-black p-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
                  title="Close document"
                >
                  <ArrowLeft className="w-4 h-4 text-black stroke-[2.5]" />
                </button>

                <div className="h-6 w-[2px] bg-black hidden sm:block"></div>

                {/* Sidebar Toggle */}
                <button
                  onClick={() => setSidebarOpen(prev => !prev)}
                  className="bg-white border-2 border-black p-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer"
                  title="Toggle Sidebar"
                >
                  <Menu className="w-4 h-4 text-black stroke-[2.5]" />
                </button>
              </div>

              {/* Central Zoom & Page Navigation Controls */}
              <div className="flex items-center bg-white border-2 border-black rounded-lg py-1 px-2.5 space-x-3.5 shadow-[2px_2px_0px_0px_#000]">
                {/* Prev Page */}
                <button
                  disabled={currentPage <= 1}
                  onClick={() => scrollToPage(currentPage - 1)}
                  className="p-1 rounded hover:bg-slate-100 text-black disabled:text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Page Indicator */}
                <div className="flex items-center font-mono font-bold text-xs space-x-1.5">
                  <input
                    type="number"
                    min={1}
                    max={numPages}
                    value={currentPage}
                    onChange={(e) => {
                      const p = parseInt(e.target.value);
                      if (p >= 1 && p <= numPages) scrollToPage(p);
                    }}
                    className="w-10 text-center border-2 border-black rounded bg-slate-50 font-black p-0.5 outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-slate-400">/</span>
                  <span className="font-black text-slate-800">{numPages || "?"}</span>
                </div>

                {/* Next Page */}
                <button
                  disabled={currentPage >= numPages}
                  onClick={() => scrollToPage(currentPage + 1)}
                  className="p-1 rounded hover:bg-slate-100 text-black disabled:text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="h-4 w-[1.5px] bg-slate-300"></div>

                {/* Zoom Out */}
                <button
                  onClick={zoomOut}
                  className="p-1 rounded hover:bg-slate-100 text-black transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Zoom Level Indicator */}
                <button 
                  onClick={zoomReset}
                  className="font-mono font-bold hover:text-slate-700 min-w-[45px] text-center cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoomScale * 100)}%
                </button>

                {/* Zoom In */}
                <button
                  onClick={zoomIn}
                  className="p-1 rounded hover:bg-slate-100 text-black transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="h-4 w-[1.5px] bg-slate-300 hidden sm:block"></div>

                {/* Fit Width */}
                <button
                  onClick={fitToWidth}
                  className="p-1 rounded hover:bg-slate-100 text-black transition-colors hidden sm:block cursor-pointer"
                  title="Fit to Width"
                >
                  <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Fit Height */}
                <button
                  onClick={fitToHeight}
                  className="p-1 rounded hover:bg-slate-100 text-black transition-colors hidden sm:block cursor-pointer"
                  title="Fit to Height"
                >
                  <Minimize2 className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Action Buttons (Print and Download) */}
              <div className="flex items-center space-x-2">
                {/* Print */}
                <button
                  onClick={handlePrint}
                  className="bg-white border-2 border-black p-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-colors active:scale-95 hidden sm:block cursor-pointer"
                  title="Print Document"
                >
                  <Printer className="w-4 h-4 text-black stroke-[2.5]" />
                </button>

                {/* Download */}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download={fileName || "document.pdf"}
                    className="bg-white border-2 border-black p-1.5 rounded-lg shadow-[2px_2px_0px_0px_#000] hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer flex items-center"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4 text-black stroke-[2.5]" />
                  </a>
                )}
              </div>
            </div>

            {/* Document Render Canvas Container */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-6 flex flex-col items-center"
            >
              {loading ? (
                /* Beautiful Neo-brutalist Loading Screen */
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="relative bg-white border-3 border-black p-8 rounded-2xl shadow-[5px_5px_0px_0px_#000] flex flex-col items-center space-y-4 max-w-sm text-center">
                    <Loader2 className="w-10 h-10 text-black animate-spin stroke-[2.5]" />
                    <h3 className="font-display font-black text-lg uppercase tracking-wide">Rendering Document...</h3>
                    <div className="w-full bg-slate-100 border-2 border-black rounded-full h-4 overflow-hidden shadow-[2px_2px_0px_0px_#000]">
                      <div className="bg-[#a3e635] h-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-500">{loadingProgress}% Complete</span>
                  </div>
                </div>
              ) : error ? (
                /* Error Screen */
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="bg-[#ff5a5f] border-3 border-black text-white p-6 rounded-2xl shadow-[5px_5px_0px_0px_#000] flex flex-col items-center space-y-4 max-w-md text-center">
                    <AlertCircle className="w-10 h-10 stroke-[2.5]" />
                    <h3 className="font-display font-black text-lg uppercase tracking-wide">Error Loading Document</h3>
                    <p className="text-sm font-semibold leading-relaxed">{error}</p>
                    <button 
                      onClick={() => setPdfUrl(null)}
                      className="bg-white border-2 border-black text-black px-4 py-2 font-display font-black uppercase text-xs rounded-xl shadow-[3px_3px_0px_0px_#000] active:scale-95 cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                /* Document Pages rendering list */
                Array.from({ length: numPages }).map((_, i) => (
                  <PDFPage key={i} pageNum={i + 1} />
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
