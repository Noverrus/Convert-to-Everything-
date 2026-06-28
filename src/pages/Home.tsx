import { Link } from "react-router-dom";
import { Image, FileText, Video, Archive, FileCode, BookOpen, Type, Presentation, FileSpreadsheet, Layers, ArrowRight, ShieldCheck, Zap, HardDrive } from "lucide-react";
import { motion } from "framer-motion";

const tools = [
  {
    name: "Image Converter",
    description: "Convert and optimize WEBP, PNG, JPG, and GIF locally.",
    icon: Image,
    href: "/image",
    borderColor: "border-blue-200 hover:border-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    name: "Document Converter",
    description: "Convert PDF, TXT, Word, HTML and PDF structures instantly.",
    icon: FileText,
    href: "/document",
    borderColor: "border-rose-200 hover:border-rose-500",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
  },
  {
    name: "Video Converter",
    description: "WASM-encoded sequential offline video & audio conversions.",
    icon: Video,
    href: "/video",
    borderColor: "border-indigo-200 hover:border-indigo-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
  },
  {
    name: "Archive Manager",
    description: "Build custom ZIP files or extract ZIPs offline securely.",
    icon: Archive,
    href: "/archive",
    borderColor: "border-emerald-200 hover:border-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
  {
    name: "CAD Vector Converter",
    description: "Render DXF/SVG lines to canvas and export to standard image or PDF.",
    icon: FileCode,
    href: "/cad",
    borderColor: "border-amber-200 hover:border-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  {
    name: "Ebook Publisher",
    description: "Compile TXT, MD, and HTML manuscripts directly into EPUB publications.",
    icon: BookOpen,
    href: "/ebook",
    borderColor: "border-cyan-200 hover:border-cyan-500",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
  },
  {
    name: "Font CSS Packager",
    description: "Load dynamic typography faces and build embedding @font-face CSS packages.",
    icon: Type,
    href: "/font",
    borderColor: "border-purple-200 hover:border-purple-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
  },
  {
    name: "Presentation Slideshow",
    description: "Draft, style, and compile high-resolution PDF presentation slide decks.",
    icon: Presentation,
    href: "/presentation",
    borderColor: "border-teal-200 hover:border-teal-500",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
  },
  {
    name: "Spreadsheet & Data",
    description: "Instantly parse CSV to JSON or generate CSV from JSON arrays locally.",
    icon: FileSpreadsheet,
    href: "/spreadsheet",
    borderColor: "border-slate-300 hover:border-slate-600",
    bgColor: "bg-slate-100",
    textColor: "text-slate-800",
  },
  {
    name: "Vector Rasterizer",
    description: "Convert vector SVGs into PNG, JPEG, or WEBP at crisp resolutions.",
    icon: Layers,
    href: "/vector",
    borderColor: "border-sky-200 hover:border-sky-500",
    bgColor: "bg-sky-50",
    textColor: "text-sky-700",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export function Home() {
  return (
    <div className="flex-1 flex flex-col space-y-12 pb-8">
      
      {/* Hero Section */}
      <section className="text-center pt-10 pb-6 px-4 sm:px-6 space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Uncompromised Privacy. <br />
          <span className="text-indigo-600 font-bold">Pure Client-Side Conversion.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Convert documents, archives, multimedia, fonts, CAD diagrams, and sheets completely offline inside your browser's secure memory sandbox.
        </p>
      </section>

      {/* Tools Grid - Flat design style */}
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full px-4"
      >
        {tools.map((tool) => (
          <motion.div key={tool.name} variants={item}>
            <Link
              to={tool.href}
              className={`group relative flex flex-col items-start justify-between p-6 h-full bg-white border-2 rounded-xl transition-all ${tool.borderColor}`}
            >
              <div className="space-y-4 w-full">
                <div className={`inline-flex items-center justify-center p-3 rounded-lg ${tool.bgColor} ${tool.textColor}`}>
                  <tool.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-slate-500 mt-1 text-xs leading-relaxed">{tool.description}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center text-xs font-bold text-indigo-600 transition-all">
                Launch Tool <ArrowRight className="ml-1 w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Features - Flat layout */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-10 px-4 max-w-5xl mx-auto text-center border-t border-slate-200">
        <div className="flex flex-col items-center p-4">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">100% Privacy Sandbox</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">No tracking, no server storage. Everything processes in local client memory securely.</p>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Pure Offline Architecture</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Leverages client-side WebAssembly rendering kernels to perform high-speed compilation.</p>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <HardDrive className="h-5 w-5 text-emerald-600" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Auto Garbage Cleanup</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Memory blobs expire and purge automatically after 1 hour to prevent system memory leaks.</p>
        </div>
      </section>

    </div>
  );
}
