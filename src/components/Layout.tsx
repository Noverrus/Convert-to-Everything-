import { Outlet, Link, useLocation } from "react-router-dom";
import { FileCode2, Image, FileText, Video, Music, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Image", path: "/image", icon: Image },
  { name: "Cloud Image", path: "/image-server", icon: Cloud },
  { name: "Document", path: "/document", icon: FileText },
  { name: "Media", path: "/media", icon: Video },
  { name: "Audio", path: "/audio", icon: Music },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b backdrop-blur bg-white/80 shrink-0">
        <div className="mx-auto flex h-16 max-w-7xl items-centerjustify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 mr-6 text-indigo-600">
              <FileCode2 className="h-6 w-6 relative" />
              <span className="font-bold hidden sm:inline-block">WASM Converter</span>
            </Link>
            <nav className="flex space-x-1 sm:space-x-4 flex-1">
              <Link 
                to="/"
                className={cn(
                  "hidden sm:flex text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/" ? "text-indigo-600" : "text-slate-600"
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
                      "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-slate-100",
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline-block">{link.name}</span>
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

      {/* Footer */}
      <footer className="shrink-0 border-t py-6 text-center text-sm text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <p>Open Source WebAssembly File Converter.</p>
          <p className="mt-1 text-slate-400">All conversions happen locally in your browser. No files are uploaded.</p>
        </div>
      </footer>
    </div>
  );
}
