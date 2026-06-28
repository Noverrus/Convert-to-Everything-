import { Outlet, Link, useLocation } from "react-router-dom";
import { FileCode2, Image, FileText, Video, Archive, FileCode, BookOpen, Type, Presentation, FileSpreadsheet, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Image", path: "/image", icon: Image },
  { name: "Document", path: "/document", icon: FileText },
  { name: "Video", path: "/video", icon: Video },
  { name: "Archive", path: "/archive", icon: Archive },
  { name: "CAD", path: "/cad", icon: FileCode },
  { name: "Ebook", path: "/ebook", icon: BookOpen },
  { name: "Font", path: "/font", icon: Type },
  { name: "Presentation", path: "/presentation", icon: Presentation },
  { name: "Spreadsheet", path: "/spreadsheet", icon: FileSpreadsheet },
  { name: "Vector", path: "/vector", icon: Layers },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans flex flex-col antialiased">
      {/* Navbar - Pure Flat Design */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shrink-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 w-full">
            <Link to="/" className="flex items-center space-x-2 mr-4 text-indigo-600 shrink-0">
              <FileCode2 className="h-6 w-6" />
              <span className="font-bold tracking-tight text-slate-900">WASM Converter</span>
            </Link>
            
            {/* Scrollable horizontal list on mobile, neat list on desktop */}
            <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1 flex-1 mask-linear">
              <Link 
                to="/"
                className={cn(
                  "text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-all shrink-0 hover:bg-slate-100",
                  location.pathname === "/" ? "bg-slate-100 text-indigo-600 font-semibold" : "text-slate-600"
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
                      "flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 hover:bg-slate-100",
                      isActive ? "bg-indigo-600 text-white font-semibold" : "text-slate-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <Outlet />
      </main>

      {/* Footer - Flat minimalist design */}
      <footer className="shrink-0 border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-slate-600">Pure Client-Side WebAssembly File Processing Suite</p>
          <p className="text-slate-400">Copyright (c) 2026 Noverrus Dev. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </div>
  );
}
