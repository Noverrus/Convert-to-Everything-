import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FileCode2, Image, FileText, Video, Archive, FileCode, BookOpen, Type, Presentation, FileSpreadsheet, Layers, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Image", path: "/image-converter", icon: Image },
  { name: "Document", path: "/document-converter", icon: FileText },
  { name: "Video", path: "/video-converter", icon: Video },
  { name: "Archive", path: "/archive-converter", icon: Archive },
  { name: "CAD", path: "/cad-converter", icon: FileCode },
  { name: "Ebook", path: "/ebook-converter", icon: BookOpen },
  { name: "Font", path: "/font-converter", icon: Type },
  { name: "Presentation", path: "/presentation-converter", icon: Presentation },
  { name: "Spreadsheet", path: "/spreadsheet-converter", icon: FileSpreadsheet },
  { name: "Vector", path: "/vector-converter", icon: Layers },
  { name: "PDF Viewer", path: "/pdf-viewer", icon: Eye },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans flex flex-col antialiased">
      {/* Navbar - Premium Neo-brutalist Design */}
      <header className="sticky top-0 z-40 w-full border-b-[3px] border-black bg-white shrink-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between space-x-4 w-full">
            <Link 
              to="/" 
              className="flex items-center space-x-2 font-display font-black text-sm sm:text-base uppercase tracking-wider bg-[#ffde43] border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000] transition-all shrink-0 active:scale-95"
            >
              <FileCode2 className="h-5 w-5 stroke-[2.5]" />
              <span className="font-extrabold tracking-tight">WASM CONVERTER</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 overflow-x-auto scrollbar-none py-2 flex-1 mask-linear">
              <Link 
                to="/"
                className={cn(
                  "text-xs font-bold font-display uppercase tracking-wider px-3 py-2 rounded-lg border-2 transition-all shrink-0 active:scale-95",
                  location.pathname === "/" 
                    ? "bg-[#ff90e8] border-black text-black font-extrabold shadow-[2px_2px_0px_0px_#000]" 
                    : "bg-white border-transparent text-slate-700 hover:border-black hover:bg-slate-100"
                )}
              >
                Dashboard
              </Link>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider border-2 transition-all shrink-0 active:scale-95",
                      isActive 
                        ? "bg-[#38bdf8] border-black text-black font-extrabold shadow-[2px_2px_0px_0px_#000]" 
                        : "bg-white border-transparent text-slate-700 hover:border-black hover:bg-slate-100"
                    )}
                  >
                    <Icon className="h-4 w-4 stroke-[2.5]" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile/Tablet Dropdown Navigation */}
            <div className="flex md:hidden items-center shrink-0">
              <select
                value={location.pathname === "/" ? "/" : "/" + location.pathname.split("/")[1]}
                onChange={(e) => navigate(e.target.value)}
                className="border-2 border-black rounded-lg px-2 py-1.5 text-xs font-mono font-black bg-[#ffde43] text-black shadow-[2.5px_2.5px_0px_0px_#000] focus-visible:ring-2 focus-visible:ring-black outline-none cursor-pointer"
                aria-label="Navigate to another converter"
              >
                <option value="/">Dashboard</option>
                {navLinks.map((link) => (
                  <option key={link.path} value={link.path}>
                    {link.name} Converter
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <Outlet />
      </main>

      {/* Footer - Neo-brutalist minimalist design */}
      <footer className="shrink-0 border-t-[3px] border-black py-8 bg-white text-black font-mono">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          <p className="font-extrabold text-sm uppercase tracking-wide">
            ⚡ PURE CLIENT-SIDE WASM CONVERTER ⚡
          </p>
          <p className="text-xs text-slate-600 font-semibold">
            All processing is performed 100% offline within your browser memory. No data is sent to any server.
          </p>
          <div className="inline-block bg-[#a3e635] border-2 border-black px-3 py-1 font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000]">
            Privacy Sandbox Secured
          </div>
          <p className="text-[10px] text-slate-500 font-semibold pt-1">
            Copyright &copy; 2026 WASM Converter Corp. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
