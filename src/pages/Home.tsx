import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Image, FileText, Video, Archive, FileCode, BookOpen, Type, 
  Presentation, FileSpreadsheet, Layers, ArrowRight, ShieldCheck, 
  Zap, HardDrive, ChevronDown, ChevronUp, HelpCircle, Search, 
  RefreshCw, File, UploadCloud, X, Eye 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tools = [
  {
    name: "Image Converter",
    description: "Convert and optimize WEBP, PNG, JPG, and GIF locally.",
    icon: Image,
    href: "/image-converter",
    borderColor: "border-black",
    bgColor: "bg-[#ff90e8]", // Hot Pink
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Document Converter",
    description: "Convert PDF, TXT, Word, HTML and PDF structures instantly.",
    icon: FileText,
    href: "/document-converter",
    borderColor: "border-black",
    bgColor: "bg-[#38bdf8]", // Sky Blue
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Video Converter",
    description: "WASM-encoded sequential offline video & audio conversions.",
    icon: Video,
    href: "/video-converter",
    borderColor: "border-black",
    bgColor: "bg-[#a3e635]", // Lime Green
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Archive Manager",
    description: "Build custom ZIP files or extract ZIPs offline securely.",
    icon: Archive,
    href: "/archive-converter",
    borderColor: "border-black",
    bgColor: "bg-[#ffde43]", // Vibrant Yellow
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "CAD Vector Converter",
    description: "Render DXF/SVG lines to canvas and export to standard image or PDF.",
    icon: FileCode,
    href: "/cad-converter",
    borderColor: "border-black",
    bgColor: "bg-[#fb923c]", // Vibrant Orange
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Ebook Publisher",
    description: "Compile TXT, MD, and HTML manuscripts directly into EPUB publications.",
    icon: BookOpen,
    href: "/ebook-converter",
    borderColor: "border-black",
    bgColor: "bg-[#c084fc]", // Purple
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Font CSS Packager",
    description: "Load dynamic typography faces and build embedding @font-face CSS packages.",
    icon: Type,
    href: "/font-converter",
    borderColor: "border-black",
    bgColor: "bg-[#2dd4bf]", // Teal
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Presentation Slideshow",
    description: "Draft, style, and compile high-resolution PDF presentation slide decks.",
    icon: Presentation,
    href: "/presentation-converter",
    borderColor: "border-black",
    bgColor: "bg-[#f472b6]", // Pastel Pink
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Spreadsheet & Data",
    description: "Instantly parse CSV to JSON or generate CSV from JSON arrays locally.",
    icon: FileSpreadsheet,
    href: "/spreadsheet-converter",
    borderColor: "border-black",
    bgColor: "bg-[#94a3b8]", // Gray-slate
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Vector Rasterizer",
    description: "Convert vector SVGs into PNG, JPEG, or WEBP at crisp resolutions.",
    icon: Layers,
    href: "/vector-converter",
    borderColor: "border-black",
    bgColor: "bg-[#60a5fa]", // Blue
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
  {
    name: "Interactive PDF & Doc Viewer",
    description: "View PDFs and other documents with interactive sidebar outline, zoom, and print.",
    icon: Eye,
    href: "/pdf-viewer",
    borderColor: "border-black",
    bgColor: "bg-[#2dd4bf]", // Teal
    textColor: "text-black",
    shadowColor: "shadow-[5px_5px_0px_0px_#000]",
  },
];

// Supported Formats Guide Data for bottom accordion
const formatData = [
  {
    id: "image",
    name: "Image Converter",
    icon: Image,
    description: "Convert and optimize images independently and offline directly in your browser.",
    subFlows: [
      { from: "PNG", to: "JPG, WEBP, GIF", details: "Convert transparent or opaque PNG files into high-quality JPG, ultra-compressed WEBP, or GIF." },
      { from: "JPG", to: "PNG, WEBP, GIF, AVIF, BMP, EPS, ICO, ODD, PS, PSD, TIFF, PDF", details: "Convert standard JPEG/JPG images to PNG, WEBP, GIF, AVIF, BMP, EPS, ICO, ODD, PS, PSD, TIFF, or PDF." },
      { from: "WEBP", to: "PNG, JPG, GIF", details: "Decompress modern WEBP images to high-quality PNG or standard JPG." },
      { from: "HEIC / HEIF", to: "PNG, JPG, WEBP, GIF", details: "Extract high-definition Apple HEIC image formats directly in the browser to offline web-friendly formats." },
      { from: "BMP", to: "PNG, JPG, WEBP, GIF", details: "Convert raw Bitmap images to compressed web formats." },
      { from: "GIF", to: "PNG, JPG, WEBP", details: "Extract or convert GIF files into high-performance static images." },
      { from: "TIFF / TIF", to: "PNG, JPG, WEBP, GIF", details: "Convert high-quality print TIFF image formats into browser-compatible formats." }
    ],
    details: "Supports advanced compression, angle rotation, and pixel dimension adjustments instantly on the client side without needing additional servers.",
    accentColor: "bg-[#ff90e8] text-black border-black",
  },
  {
    id: "document",
    name: "Document Converter",
    icon: FileText,
    description: "Compile a set of scanned images or raw text into a complete PDF.",
    subFlows: [
      { from: "Images (PNG, JPG, BMP)", to: "Unified PDF Document", details: "Assemble multiple sheets of printed/scanned images into a unified PDF report file offline." },
      { from: "Plain Text (.txt)", to: "Unified PDF Document", details: "Package plain text drafts into modern PDF layout files." }
    ],
    details: "Helps organize page sequence, set document margin edges, and adjust Portrait / Landscape layouts offline.",
    accentColor: "bg-[#38bdf8] text-black border-black",
  },
  {
    id: "video",
    name: "Video & Audio Converter",
    icon: Video,
    description: "Convert multimedia video and complete audio formats powered by WebAssembly.",
    subFlows: [
      { from: "MP4", to: "WEBM, AVI, MP3, WAV", details: "Extract MP3 audio clips or convert MP4 container video formats to high-speed WEBM." },
      { from: "WEBM", to: "MP4, AVI, MP3, WAV", details: "Convert web-friendly WEBM videos to universal MP4 binary format." },
      { from: "AVI", to: "MP4, WEBM, MP3, WAV", details: "Compile older AVI videos to modern H.264 MP4 compression or audio only." },
      { from: "MOV / MKV", to: "MP4, WEBM, MP3, WAV", details: "Open Apple MOV or MKV multimedia containers offline for compression." },
      { from: "Audio (MP3, WAV, FLAC, AAC, M4A)", to: "MP3, WAV", details: "[ponytail: filter standard streams] Compress lossless or lossy audio formats to target bit rate levels." }
    ],
    details: "Runs pure offline compilation in the browser using ported FFmpeg WASM binaries. Equipped with sequential process queuing to guarantee memory efficiency.",
    accentColor: "bg-[#a3e635] text-black border-black",
  },
  {
    id: "archive",
    name: "Archive Manager",
    icon: Archive,
    description: "Bundle files into compressed ZIP folders or extract your ZIP archives.",
    subFlows: [
      { from: "All Digital Files", to: "Compressed ZIP Archive", details: "Pack multiple files at once into a single compressed ZIP bundle offline." },
      { from: "ZIP Files", to: "Original File Extraction", details: "Extract contents of ZIP files directly into browser memory for separate downloads." }
    ],
    details: "High-speed JSZip compression system free from upload payload limits. Secure confidential files from third-party servers.",
    accentColor: "bg-[#ffde43] text-black border-black",
  },
  {
    id: "cad",
    name: "CAD Vector Converter",
    icon: FileCode,
    description: "Parse DXF blueprint files and SVG formats into interactive canvas representations.",
    subFlows: [
      { from: "DXF (AutoCAD Blueprint)", to: "PNG, PDF, SVG", details: "Read curve lines of Cartesian coordinates and render them to visual formats." },
      { from: "SVG (Scalable Vector)", to: "PNG, PDF", details: "Render raw vector lines into bitmap pixel image formats or print-ready PDFs." }
    ],
    details: "Read vector entity data such as circles, straight lines, and arcs mechanically to HTML5 canvas complete with zoom and pan navigation.",
    accentColor: "bg-[#fb923c] text-black border-black",
  },
  {
    id: "ebook",
    name: "Ebook Publisher",
    icon: BookOpen,
    description: "Link Markdown manuscripts or text drafts into ready-to-publish e-book publications.",
    subFlows: [
      { from: "TXT / MD / HTML", to: "EPUB (Standard Ebook)", details: "Package manuscripts chapter by chapter complete with a cover file into standard e-reader digital book files." },
      { from: "TXT / MD", to: "PDF Document, Clean TXT", details: "Export writing drafts into print-ready PDF layouts or formatted text files." }
    ],
    details: "Ideal for indie authors. Upload manuscripts chapter by chapter, add a cover file, and export e-books that pass readability checks for Google Books, Apple Books, or Kindle.",
    accentColor: "bg-[#c084fc] text-black border-black",
  },
  {
    id: "font",
    name: "Font CSS Packager",
    icon: Type,
    description: "Inspect your custom typography and package them into @font-face stylesheets.",
    subFlows: [
      { from: "TTF / OTF (TrueType / OpenType)", to: "CSS @font-face & Preview", details: "Analyze your typography typefaces and generate ready-to-use offline @font-face stylesheets." },
      { from: "WOFF / WOFF2 (Web Fonts)", to: "CSS @font-face & Preview", details: "Verify web fonts to ensure compatibility with modern or older browsers." }
    ],
    details: "Uses the browser FontFace API in real-time to load typefaces. Makes it easier for web developers to inspect glyph characters offline.",
    accentColor: "bg-[#2dd4bf] text-black border-black",
  },
  {
    id: "presentation",
    name: "Presentation Slideshow",
    icon: Presentation,
    description: "Design widescreen-style presentation slides and compile them directly to PDF.",
    subFlows: [
      { from: "Slide Draft Editor", to: "Slide PDF (16:9)", details: "Create widescreen presentation drafts and convert them directly into crisp PDF document files." }
    ],
    details: "A quick alternative to PowerPoint. Just enter your presentation content into our visual editor and the system dynamically arranges the grid.",
    accentColor: "bg-[#f472b6] text-black border-black",
  },
  {
    id: "spreadsheet",
    name: "Spreadsheet & Data Converter",
    icon: FileSpreadsheet,
    description: "Convert CSV row files to structured JSON format or vice versa.",
    subFlows: [
      { from: "CSV (Comma-Separated Data)", to: "Structured JSON (Array)", details: "Convert tabular data from Microsoft Excel to ready-to-use JSON array data for API integration." },
      { from: "JSON (Array of Objects)", to: "Tabular CSV", details: "Convert raw JSON data formats into comma-formatted CSV spreadsheet files." }
    ],
    details: "Extremely useful for secure spreadsheet data processing. Row parsing runs fast in the browser with no risk of corporate data leaks.",
    accentColor: "bg-[#94a3b8] text-black border-black",
  },
  {
    id: "vector",
    name: "Vector Rasterizer",
    icon: Layers,
    description: "Rasterize sharp SVG vector curves into high-resolution pixel-based images.",
    subFlows: [
      { from: "SVG (Scalable Vector Graphics)", to: "PNG, JPG, WEBP, PDF", details: "Rasterize sharp SVG files into raster pixel images (lossy/lossless) with up to 4x resolution multiplier control." }
    ],
    details: "Supports multiplier scaling up to 4x base size to ensure SVG typography curves and logos remain crisp when exported to raster formats.",
    accentColor: "bg-[#60a5fa] text-black border-black",
  },
  {
    id: "pdf-viewer",
    name: "Interactive PDF & Doc Viewer",
    icon: Eye,
    description: "View, zoom, navigate, and print any PDF document locally in your browser.",
    subFlows: [
      { from: "PDF Document File", to: "Interactive Reader Canvas", details: "Renders multi-page PDF documents locally onto a canvas using PDF.js. Includes interactive sidebar with thumbnails and table of contents." }
    ],
    details: "A perfect alternative to native PDF readers. Built entirely in client-side React with full layout matching and advanced controls.",
    accentColor: "bg-[#2dd4bf] text-black border-black",
  },
];

// Rich Formats Structure for Popover (Gambar 2 representation)
const categoriesList = [
  { id: "archive", name: "Archive", page: "archive-converter", formats: ["ZIP", "7Z", "RAR", "TAR", "GZ", "BZ2"] },
  { id: "audio", name: "Audio", page: "video-converter", formats: ["MP3", "WAV", "FLAC", "AAC", "OGG", "M4A"] },
  { id: "cad", name: "Cad", page: "cad-converter", formats: ["DXF"] },
  { id: "document", name: "Document", page: "document-converter", formats: ["PDF", "TXT", "DOCX", "HTML"] },
  { id: "ebook", name: "Ebook", page: "ebook-converter", formats: ["EPUB", "MD"] },
  { id: "font", name: "Font", page: "font-converter", formats: ["TTF", "OTF", "WOFF", "WOFF2"] },
  { id: "image", name: "Image", page: "image-converter", formats: ["PNG", "JPG", "JPEG", "WEBP", "HEIC", "HEIF", "BMP", "GIF", "TIFF"] },
  { id: "presentation", name: "Presentation", page: "presentation-converter", formats: ["PDF"] },
  { id: "spreadsheet", name: "Spreadsheet", page: "spreadsheet-converter", formats: ["CSV", "JSON"] },
  { id: "vector", name: "Vector", page: "vector-converter", formats: ["SVG"] }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
};

export function Home() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Selector states (Gambar 1)
  const [activeSourceFormat, setActiveSourceFormat] = useState<string>("DOCX");
  const [activeTargetFormat, setActiveTargetFormat] = useState<string>("PDF");
  const [isDragging, setIsDragging] = useState(false);

  // Search popover state (Gambar 2)
  const [openSelector, setOpenSelector] = useState<"source" | "target" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("archive");

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSwapFormats = () => {
    const temp = activeSourceFormat;
    setActiveSourceFormat(activeTargetFormat);
    setActiveTargetFormat(temp);
  };

  const getPageForExtension = (ext: string): { page: string; categoryId: string } => {
    const norm = ext.toUpperCase();
    for (const cat of categoriesList) {
      if (cat.formats.includes(norm)) {
        return { page: cat.page, categoryId: cat.id };
      }
    }
    return { page: "image-converter", categoryId: "image" };
  };

  // Handle format pick from modal grid
  const handleSelectFormat = (format: string, catPage: string) => {
    if (openSelector === "source") {
      setActiveSourceFormat(format);
      // Immediately navigate to [JenisFile]-converter/[ekstensi] as requested!
      navigate(`/${catPage}/${format.toLowerCase()}`);
    } else {
      setActiveTargetFormat(format);
      // If we are choosing target format, navigate based on source format page!
      const srcInfo = getPageForExtension(activeSourceFormat);
      navigate(`/${srcInfo.page}/${activeSourceFormat.toLowerCase()}`, {
        state: { preloadedTargetFormat: format.toLowerCase() }
      });
    }
    setOpenSelector(null);
    setSearchQuery("");
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (files: FileList | File[]) => {
    if (files.length === 0) return;
    const firstFile = files[0];
    const ext = firstFile.name.split('.').pop()?.toUpperCase() || "";
    
    // Look up correct converter
    const { page } = getPageForExtension(ext);
    
    // Route user directly to that specific converter page and pass file via location state!
    navigate(`/${page}/${ext.toLowerCase()}`, {
      state: { 
        preloadedFiles: Array.from(files),
        preloadedTargetFormat: activeTargetFormat.toLowerCase()
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  // Filter formats based on search
  const filteredCategories = categoriesList.map(cat => {
    const matchedFormats = cat.formats.filter(fmt => 
      fmt.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, formats: matchedFormats };
  }).filter(cat => cat.formats.length > 0);

  return (
    <div className="flex-1 flex flex-col space-y-12 pb-16 relative">
      
      {/* Gambar 1 - Premium CloudConvert-inspired Hero Selector Section in Neo-brutalist Style */}
      <section className="w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-8">
        <div className="bg-[#161a24] border-[4px] border-black rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-[8px_8px_0px_0px_#000]">
          {/* Subtle Grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#262b3a_1px,transparent_1px),linear-gradient(to_bottom,#262b3a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 pointer-events-none"></div>

          <div className="relative z-10 text-center space-y-6">
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#a3e635] tracking-tight uppercase leading-none">
              Convert Any File
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-mono font-medium">
              Drop a file and pick what to turn it into. Handles 200+ formats across documents, images, audio, video, archives and more — straight from your browser.
            </p>

            {/* Interactive Formats Picker Widgets (DOCX TO PDF) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2 max-w-lg mx-auto">
              {/* Left format card (Source) */}
              <button
                onClick={() => setOpenSelector("source")}
                className="w-full sm:w-44 bg-white border-3 border-black rounded-xl p-4 text-left transition-all flex flex-col justify-between h-24 text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:scale-95 cursor-pointer"
              >
                <span className="text-[10px] uppercase font-display font-extrabold tracking-widest text-[#ff6b2b]">From</span>
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xl font-black">{activeSourceFormat}</span>
                  <ChevronDown className="w-5 h-5 text-black stroke-[3]" />
                </div>
              </button>

              {/* Sync Arrow Switcher circle */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <button
                  onClick={handleSwapFormats}
                  className="h-10 w-10 rounded-full bg-[#ffde43] border-3 border-black hover:bg-[#ffe566] text-black transition-all flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000] active:scale-95"
                  title="Swap formats"
                >
                  <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="text-[9px] uppercase font-display font-black tracking-widest text-slate-400 mt-1.5">TO</span>
              </div>

              {/* Right format card (Target) */}
              <button
                onClick={() => setOpenSelector("target")}
                className="w-full sm:w-44 bg-white border-3 border-black rounded-xl p-4 text-left transition-all flex flex-col justify-between h-24 text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] active:scale-95 cursor-pointer"
              >
                <span className="text-[10px] uppercase font-display font-extrabold tracking-widest text-indigo-600">To</span>
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xl font-black">{activeTargetFormat}</span>
                  <ChevronDown className="w-5 h-5 text-black stroke-[3]" />
                </div>
              </button>
            </div>

            {/* Dropzone Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-xl p-8 max-w-lg mx-auto transition-all flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? "border-[#ff5a5f] bg-[#ff5a5f]/10"
                  : "border-black bg-white text-black shadow-[4px_4px_0px_0px_#000]"
              }`}
            >
              <div className="h-14 w-14 rounded-xl bg-[#ff5a5f] border-3 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000]">
                <UploadCloud className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-display font-black uppercase tracking-wider">Select your file here to get started</p>
                <p className="text-xs font-mono font-semibold text-slate-600">or drop your file here.</p>
              </div>

              {/* Red-Orange select file button */}
              <div className="relative inline-block mt-1">
                <button
                  onClick={() => document.getElementById("hero-file-selector")?.click()}
                  className="bg-[#e04f4f] hover:bg-[#ff5a5f] text-white border-2 border-black px-5 py-3 rounded-xl text-xs font-display font-black uppercase tracking-wide transition-all inline-flex items-center gap-2 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] active:scale-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  <File className="w-4 h-4 stroke-[2.5]" />
                  Select File
                  <ChevronDown className="w-3.5 h-3.5 border-l-2 border-black pl-1 ml-1" />
                </button>
                <input
                  id="hero-file-selector"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gambar 2 - Searchable Multi-Category Formats Popover Dialog Modal (Neo-brutalist Edition) */}
      <AnimatePresence>
        {openSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setOpenSelector(null);
                setSearchQuery("");
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white border-[4px] border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_#000] flex flex-col h-[520px] text-black"
            >
              {/* Popover Header */}
              <div className="p-4 border-b-3 border-black bg-[#ffde43] flex items-center justify-between">
                <h3 className="font-display font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <span>Select {openSelector === "source" ? "Source" : "Target"} Format</span>
                  <span className="text-[10px] px-2 py-0.5 border-2 border-black rounded bg-white font-mono font-bold">
                    {openSelector === "source" ? "From" : "To"}
                  </span>
                </h3>
                <button
                  onClick={() => {
                    setOpenSelector(null);
                    setSearchQuery("");
                  }}
                  className="p-1 rounded-lg border-2 border-black bg-white hover:bg-[#ff90e8] text-black transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Search Bar Input */}
              <div className="p-4 bg-[#f5f5f0] border-b-3 border-black flex items-center relative gap-3">
                <Search className="w-4 h-4 text-black stroke-[3] absolute left-7 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Format (e.g. PNG, JPG, PDF...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-black placeholder-slate-500 border-2 border-black focus:outline-none rounded-xl py-2.5 pl-11 pr-4 text-xs font-mono font-bold tracking-wider transition-colors shadow-[3px_3px_0px_0px_#000]"
                  autoFocus
                />
              </div>

              {/* Split Content Pane */}
              <div className="flex-1 flex overflow-hidden">
                {searchQuery ? (
                  /* Search Results Panel */
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fdfdfb]">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map(cat => (
                        <div key={cat.id} className="space-y-2">
                          <span className="text-[10px] font-display font-black uppercase tracking-wider text-slate-500">{cat.name}</span>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {cat.formats.map(fmt => (
                              <button
                                key={fmt}
                                onClick={() => handleSelectFormat(fmt, cat.page)}
                                className="bg-white hover:bg-[#ff90e8] border-2 border-black text-black font-mono text-xs font-bold py-2 px-1 rounded-lg text-center transition-all shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000] active:scale-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                              >
                                {fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 space-y-2">
                        <p className="text-sm font-bold text-slate-600">No formats matched your search.</p>
                        <p className="text-xs text-slate-500 font-mono">Try searching for JPG, PNG, MP4, CSV, ZIP, etc.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Categories Split Panel */
                  <>
                    {/* Left Pane: Indonesian/English standard format categories list */}
                    <div className="w-1/3 border-r-3 border-black bg-[#fdfdfb] overflow-y-auto">
                      {categoriesList.map(cat => {
                        const isActive = activeCategoryTab === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategoryTab(cat.id)}
                            className={`w-full text-left px-4 py-3.5 text-xs font-extrabold font-display uppercase tracking-wider flex items-center justify-between transition-all border-b-2 border-black border-l-4 ${
                              isActive
                                ? "bg-[#38bdf8] border-l-[#ff5a5f] text-black font-black"
                                : "border-l-transparent text-slate-600 hover:text-black hover:bg-slate-100/80"
                            }`}
                          >
                            <span>{cat.name}</span>
                            <ArrowRight className={`w-3.5 h-3.5 transition-transform stroke-[2.5] ${isActive ? "translate-x-0.5 opacity-100" : "opacity-0"}`} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Pane: Grid of format buttons inside categories */}
                    <div className="w-2/3 p-4 overflow-y-auto bg-[#fafaf9]">
                      {categoriesList.map(cat => {
                        if (cat.id !== activeCategoryTab) return null;
                        return (
                          <div key={cat.id} className="space-y-3">
                            <span className="text-[10px] font-display font-black uppercase tracking-widest text-slate-500">{cat.name} Formats</span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {cat.formats.map(fmt => (
                                <button
                                  key={fmt}
                                  onClick={() => handleSelectFormat(fmt, cat.page)}
                                  className="bg-white hover:bg-[#ffde43] border-2 border-black text-black font-mono text-xs font-bold py-3 px-1 rounded-xl text-center transition-all shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#000] active:scale-95 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tools Grid - Neo-brutalist high contrast design style */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full px-4"
      >
        {tools.map((tool) => (
          <motion.div key={tool.name} variants={itemVariants}>
            <Link
              to={tool.href}
              className={`group relative flex flex-col items-start justify-between p-6 h-full bg-white border-[3px] border-black rounded-xl transition-all ${tool.shadowColor} hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-[5px_5px_0px_0px_#000]`}
            >
              <div className="space-y-4 w-full">
                <div className={`inline-flex items-center justify-center p-3 rounded-lg border-2 border-black ${tool.bgColor} ${tool.textColor} shadow-[2px_2px_0px_0px_#000]`}>
                  <tool.icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-display font-extrabold text-black uppercase tracking-wide group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-slate-700 mt-1.5 text-xs leading-relaxed font-semibold">{tool.description}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-display font-bold uppercase tracking-wider text-black bg-[#ffde43] border-2 border-black px-2.5 py-1.5 shadow-[2px_2px_0px_0px_#000] group-hover:bg-[#ff90e8] transition-colors">
                Launch Tool <ArrowRight className="ml-1 w-3.5 h-3.5 stroke-[3] transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Features - Neo-brutalist styled layouts */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-10 px-4 max-w-5xl mx-auto text-center border-t-[3px] border-black">
        <div className="flex flex-col items-center p-5 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#000]">
          <div className="h-10 w-10 rounded-lg bg-[#a3e635] border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#000]">
            <ShieldCheck className="h-5 w-5 text-black stroke-[2.5]" />
          </div>
          <h4 className="font-display font-black text-sm uppercase tracking-wide">100% Privacy Sandbox</h4>
          <p className="text-xs text-slate-700 font-semibold mt-1.5 leading-relaxed font-mono">No tracking, no server storage. Everything processes in local client memory securely.</p>
        </div>
        <div className="flex flex-col items-center p-5 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#000]">
          <div className="h-10 w-10 rounded-lg bg-[#ffde43] border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#000]">
            <Zap className="h-5 w-5 text-black stroke-[2.5]" />
          </div>
          <h4 className="font-display font-black text-sm uppercase tracking-wide">Pure Offline WASM</h4>
          <p className="text-xs text-slate-700 font-semibold mt-1.5 leading-relaxed font-mono">Leverages client-side WebAssembly rendering kernels to perform high-speed compilation.</p>
        </div>
        <div className="flex flex-col items-center p-5 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#000]">
          <div className="h-10 w-10 rounded-lg bg-[#ff90e8] border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#000]">
            <HardDrive className="h-5 w-5 text-black stroke-[2.5]" />
          </div>
          <h4 className="font-display font-black text-sm uppercase tracking-wide">Auto Garbage Cleanup</h4>
          <p className="text-xs text-slate-700 font-semibold mt-1.5 leading-relaxed font-mono">Memory blobs expire and purge automatically after 1 hour to prevent system memory leaks.</p>
        </div>
      </section>

      {/* Collapsible Supported Formats Guide - Interactive Accordion in Neo-brutalist style */}
      <section className="max-w-4xl mx-auto w-full px-4 pt-4 pb-12 border-t-[3px] border-black">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-display font-black uppercase text-black tracking-tight flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-black stroke-[2.5]" />
            Supported Formats Guide
          </h2>
          <p className="text-xs font-mono font-semibold text-slate-600 max-w-lg mx-auto">
            Click on a converter category below to see the supported source file formats and their target output formats.
          </p>
        </div>

        <div className="space-y-4">
          {formatData.map((item) => {
            const isExpanded = expandedId === item.id;
            const IconComponent = item.icon;
            
            return (
              <div 
                key={item.id} 
                className="bg-white border-[3px] border-black rounded-xl overflow-hidden transition-all duration-200 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000]"
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2 rounded-lg border-2 border-black ${item.accentColor} shadow-[2px_2px_0px_0px_#000]`}>
                       <IconComponent className="w-4.5 h-4.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-display font-black uppercase tracking-wider text-sm text-black">{item.name}</h3>
                      <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pl-4">
                    <span className="text-black text-[10px] hidden sm:inline-block font-display font-black uppercase bg-[#f5f5f0] border-2 border-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000]">
                      {isExpanded ? "Close" : "Open"}
                    </span>
                    <div className="p-1 rounded-full border-2 border-black bg-[#ffde43] text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[3]" /> : <ChevronDown className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                </button>

                {/* Collapsible Content Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-3 border-t-3 border-black bg-[#fafaf9] space-y-4 text-xs">
                        {/* Extra Description / Method details */}
                        <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] leading-relaxed text-slate-700 font-medium">
                          <strong className="text-black font-display font-extrabold uppercase text-xs block mb-1">Sandbox Mechanism:</strong>
                          {item.details}
                        </div>

                        {/* Nested Collapsible Sub-Flows */}
                        <div className="space-y-2">
                          <span className="font-display font-black text-[10px] uppercase tracking-wider text-slate-500 block mb-2">
                            Detailed Format Flows (Click to expand):
                          </span>
                          <div className="space-y-2">
                            {item.subFlows.map((flow, idx) => (
                              <details key={idx} className="group bg-white rounded-lg border-2 border-black overflow-hidden transition-all shadow-[2.5px_2.5px_0px_0px_#000]">
                                <summary className="p-3 font-mono font-bold text-xs text-black hover:bg-[#ff90e8]/10 cursor-pointer flex items-center justify-between list-none">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono bg-[#ff90e8] text-black px-1.5 py-0.5 rounded border border-black font-bold">{flow.from}</span>
                                    <span className="text-black font-bold">→</span>
                                    <span className="font-mono bg-[#a3e635] text-black px-1.5 py-0.5 rounded border border-black font-bold">{flow.to}</span>
                                  </div>
                                  <div className="p-0.5 rounded-full border border-black bg-white text-black transition-colors shrink-0 shadow-[1px_1px_0px_0px_#000]">
                                    <ChevronDown className="w-3.5 h-3.5 stroke-[3] transform group-open:rotate-180 transition-transform" />
                                  </div>
                                </summary>
                                <div className="p-3 pt-1 border-t-2 border-black text-xs font-semibold text-slate-600 leading-relaxed bg-[#fdfdfb]">
                                  {flow.details}
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
