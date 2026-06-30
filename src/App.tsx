import React, { useState, useEffect, useRef } from 'react';
import { 
  AnimatePresence, 
  motion 
} from 'framer-motion';
import { 
  Menu, X, ChevronDown, ChevronUp, Home, FileText, Image as ImageIcon, 
  Video, Music, Table, Presentation, BookOpen, Archive, PenTool, Type, 
  ShieldCheck, Zap, Download, RefreshCw, Plus, Trash2, Play, Pause, 
  Camera, Mic, Square, Copy, Check, Search, HelpCircle, ArrowRight
} from 'lucide-react';
import { RoughIllustration } from './components/RoughIllustration';

// ==========================================
// 1. LIGHTWEIGHT SPA ROUTER
// ==========================================
interface LinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Link: React.FC<LinkProps> = ({ to, children, className, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
    if (onClick) onClick();
  };
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

// ==========================================
// 2. CONVERTER TYPES DEFINITIONS
// ==========================================
interface ConverterInfo {
  id: string;
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  desc: string;
  color: string;
}

const CONVERTERS: ConverterInfo[] = [
  { id: 'documents', path: '/converter/documents', name: 'Documents Converter', icon: FileText, desc: 'Konversi teks, PDF, ekstrak teks, dan buat file dokumen secara instan.', color: 'from-blue-500 to-indigo-600' },
  { id: 'images', path: '/converter/images', name: 'Images Converter', icon: ImageIcon, desc: 'Ubah format gambar, sesuaikan ukuran, kompresi, dan terapkan filter visual.', color: 'from-emerald-500 to-teal-600' },
  { id: 'video', path: '/converter/video', name: 'Video Converter', icon: Video, desc: 'Ekstrak bingkai video (frame capture), tonton, dan analisis metadata video.', color: 'from-rose-500 to-pink-600' },
  { id: 'audio', path: '/converter/audio', name: 'Audio Converter', icon: Music, desc: 'Rekam suara, potong audio, dan visualisasikan gelombang suara secara real-time.', color: 'from-violet-500 to-purple-600' },
  { id: 'spreadsheets', path: '/converter/spreadsheets', name: 'Spreadsheets Converter', icon: Table, desc: 'Edit tabel interaktif, ubah format CSV ke JSON atau sebaliknya dengan cepat.', color: 'from-green-500 to-emerald-600' },
  { id: 'slides', path: '/converter/slides', name: 'Slides Converter', icon: Presentation, desc: 'Ubah teks Markdown menjadi tayangan slide presentasi interaktif siap pakai.', color: 'from-amber-500 to-orange-600' },
  { id: 'ebooks', path: '/converter/e-books', name: 'E-books Converter', icon: BookOpen, desc: 'Format ulang teks e-book, hitung statistik membaca, dan baca dengan mode Serif nyaman.', color: 'from-cyan-500 to-blue-600' },
  { id: 'archives', path: '/converter/archives', name: 'Archives Converter', icon: Archive, desc: 'Buat bundel arsip virtual, kompres file lokal, dan periksa isinya.', color: 'from-slate-500 to-zinc-600' },
  { id: 'vector', path: '/converter/vector', name: 'Vector Converter', icon: PenTool, desc: 'Render SVG ke PNG, edit properti gambar vektor, dan sesuaikan warna.', color: 'from-pink-500 to-rose-600' },
  { id: 'cad', path: '/converter/cad', name: 'CAD Converter', icon: PenTool, desc: 'Kanvas gambar vektor CAD interaktif, ekspor gambar ke DXF/SVG.', color: 'from-sky-500 to-blue-600' },
  { id: 'fonts', path: '/converter/fonts', name: 'Fonts Converter', icon: Type, desc: 'Unggah file font (TTF/WOFF), tes mengetik secara langsung, dan salin kode CSS.', color: 'from-fuchsia-500 to-purple-600' },
];

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [converterDropdownOpen, setConverterDropdownOpen] = useState(true);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper navigation function
  const navigateTo = (to: string) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F3EF] text-black font-sans selection:bg-[#FFE600] selection:text-black">
      
      {/* ==========================================
          HEADER BAR
         ========================================== */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 border-2 border-black bg-[#FFE600] flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000] rotate-[-3deg]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black font-display uppercase">SaveTheFile</span>
          </Link>

          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 border-3 border-black bg-[#A5F3FC] text-black font-black shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000000] transition-all cursor-pointer rounded-xl focus:outline-none"
            aria-label="Buka Menu"
          >
            {menuOpen ? <X className="w-6 h-6 stroke-[3]" /> : <Menu className="w-6 h-6 stroke-[3]" />}
          </button>
        </div>
      </header>

      {/* ==========================================
          HAMBURGER DRAWER (SIDEBAR)
         ========================================== */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white flex flex-col border-l-4 border-black shadow-[-8px_0px_0px_0px_#000000]"
            >
              <div className="p-5 border-b-4 border-black bg-[#FFE600] flex items-center justify-between">
                <span className="font-extrabold text-xl text-black font-display uppercase tracking-tight">Menu Navigasi</span>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="p-2 border-2 border-black bg-[#FFA8E8] text-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000000] transition-all cursor-pointer rounded-lg"
                >
                  <X className="w-5 h-5 stroke-[3]" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F4F3EF]">
                <Link 
                  to="/" 
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 border-3 border-black rounded-xl transition-all ${
                    path === '/' 
                      ? 'bg-[#FFE600] text-black font-bold shadow-[4px_4px_0px_0px_#000000]' 
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000]'
                  }`}
                >
                  <Home className="w-5 h-5 stroke-[2.5]" />
                  <span className="font-display font-extrabold">Home</span>
                </Link>

                <Link 
                  to="/converter" 
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 border-3 border-black rounded-xl transition-all ${
                    path === '/converter' 
                      ? 'bg-[#FFE600] text-black font-bold shadow-[4px_4px_0px_0px_#000000]' 
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000]'
                  }`}
                >
                  <Zap className="w-5 h-5 stroke-[2.5]" />
                  <span className="font-display font-extrabold">Converter Hub</span>
                </Link>

                <div className="pt-2 border-t-2 border-black mt-2">
                  <button 
                    onClick={() => setConverterDropdownOpen(!converterDropdownOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 border-2 border-black bg-[#A5F3FC] text-black rounded-xl shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-cyan-200"
                  >
                    <span className="font-bold text-xs tracking-wider uppercase font-display">Daftar Converter</span>
                    {converterDropdownOpen ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                  </button>

                  <AnimatePresence>
                    {converterDropdownOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2 mt-3 pl-1"
                      >
                        {CONVERTERS.map((conv) => {
                          const Icon = conv.icon;
                          const isActive = path === conv.path;
                          return (
                            <Link
                              key={conv.id}
                              to={conv.path}
                              onClick={() => setMenuOpen(false)}
                              className={`flex items-center space-x-3 px-3 py-2 border-2 border-black rounded-lg text-sm transition-all ${
                                isActive 
                                  ? 'bg-[#86EFAC] text-black font-bold shadow-[2px_2px_0px_0px_#000000]' 
                                  : 'bg-white text-black shadow-[1px_1px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_#000000]'
                              }`}
                            >
                              <Icon className="w-4 h-4 stroke-[2.5]" />
                              <span className="font-medium">{conv.name}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-5 border-t-3 border-black bg-[#86EFAC] text-black font-bold flex items-center space-x-2.5 text-xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span className="font-display font-extrabold uppercase tracking-wider">100% Client-Side & Privat</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================
          MAIN BODY ROUTER
         ========================================== */}
      <main className="flex-1 flex flex-col">
        {(() => {
          if (path === '/' || path === '/index.html') {
            return <HomePage navigateTo={navigateTo} />;
          } else if (path === '/converter') {
            return <ConverterHubPage navigateTo={navigateTo} />;
          } else if (path === '/converter/documents') {
            return <DocumentsConverter />;
          } else if (path === '/converter/images') {
            return <ImagesConverter />;
          } else if (path === '/converter/video') {
            return <VideoConverter />;
          } else if (path === '/converter/audio') {
            return <AudioConverter />;
          } else if (path === '/converter/spreadsheets') {
            return <SpreadsheetsConverter />;
          } else if (path === '/converter/slides') {
            return <SlidesConverter />;
          } else if (path === '/converter/e-books') {
            return <EbooksConverter />;
          } else if (path === '/converter/archives') {
            return <ArchivesConverter />;
          } else if (path === '/converter/vector') {
            return <VectorConverter />;
          } else if (path === '/converter/cad') {
            return <CadConverter />;
          } else if (path === '/converter/fonts') {
            return <FontsConverter />;
          } else {
            // Fallback to Home
            return <HomePage navigateTo={navigateTo} />;
          }
        })()}
      </main>

      {/* ==========================================
          FOOTER
         ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 text-center text-sm">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="font-semibold text-white text-base">SaveTheFile</p>
          <p className="max-w-md mx-auto text-slate-400 text-xs">
            Semua konversi file terjadi langsung di browser Anda menggunakan Web APIs, Canvas, AudioContext, dan Web Assembly lokal. File Anda aman dan tidak pernah dikirim ke server.
          </p>
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 max-w-xl mx-auto">
            <span>© 2026 SaveTheFile. All rights reserved.</span>
            <span className="flex items-center space-x-1.5 mt-1.5 sm:mt-0">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Privasi Terjamin 100%</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// PAGE: HOME PAGE
// ============================================================================
function HomePage({ navigateTo }: { navigateTo: (to: string) => void }) {
  const getFlatColor = (id: string) => {
    switch(id) {
      case 'documents': return 'bg-[#FFE600]'; // Yellow
      case 'images': return 'bg-[#86EFAC]'; // Green
      case 'video': return 'bg-[#FFA8E8]'; // Pink
      case 'audio': return 'bg-[#A5F3FC]'; // Cyan
      case 'spreadsheets': return 'bg-[#FFD0A3]'; // Peach
      case 'slides': return 'bg-[#FFE600]';
      case 'e-books': return 'bg-[#FFA8E8]';
      case 'archives': return 'bg-[#86EFAC]';
      case 'vector': return 'bg-[#A5F3FC]';
      case 'cad': return 'bg-[#FFD0A3]';
      case 'fonts': return 'bg-[#FFE600]';
      default: return 'bg-[#FFE600]';
    }
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
      
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6">
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center space-x-2 px-4 py-2 border-3 border-black bg-[#86EFAC] text-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000]"
          >
            <ShieldCheck className="w-4 h-4 stroke-[3]" />
            <span className="font-display font-extrabold tracking-wider">Lokal & 100% Privat</span>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.1] font-display uppercase"
          >
            Konversi File <br />
            <span className="bg-[#FFE600] border-3 border-black px-3 py-1 inline-block rotate-[-1.5deg] shadow-[5px_5px_0px_0px_#000000] mt-2 mb-1">
              Lokal &amp; Instan
            </span>
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-black font-semibold max-w-2xl leading-relaxed bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000000]"
          >
            SaveTheFile memproses seluruh dokumen, gambar, audio, presentasi, dan font secara lokal langsung di dalam browser Anda. Tidak ada data yang diunggah ke server eksternal mana pun. Privasi total dengan performa kilat.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={() => navigateTo('/converter')}
              className="inline-flex items-center space-x-2 px-8 py-4.5 border-4 border-black bg-[#FFE600] text-black font-black uppercase font-display tracking-wider shadow-[6px_6px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer text-base rounded-none"
            >
              <span>Jelajahi Hub Konverter</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </motion.div>
        </div>

        {/* Hand-drawn Sketch Illustration using roughjs */}
        <motion.div 
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.15 }}
          className="lg:col-span-5"
        >
          <RoughIllustration />
        </motion.div>
      </section>

      {/* Grid of Features / Converters */}
      <section className="space-y-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase font-display text-black">Pilih Modul Konversi</h2>
            <p className="text-black font-semibold text-sm">Toolkit pengolah file offline instan dan aman.</p>
          </div>
          <div className="bg-[#FFA8E8] border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]">
            11 Modul Aktif
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CONVERTERS.map((conv, idx) => {
            const Icon = conv.icon;
            const flatColor = getFlatColor(conv.id);
            return (
              <motion.div
                key={conv.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.04 * idx }}
                onClick={() => navigateTo(conv.path)}
                className="group relative bg-white border-3 border-black p-6 shadow-[5px_5px_0px_0px_#000000] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 border-3 border-black ${flatColor} flex items-center justify-center text-black shadow-[3px_3px_0px_0px_#000000] group-hover:rotate-[-6deg] transition-transform`}>
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-xl text-black font-display uppercase tracking-tight">{conv.name}</h3>
                    <p className="text-black font-medium text-xs leading-relaxed opacity-85">{conv.desc}</p>
                  </div>
                </div>
                <div className="mt-5 pt-3 border-t-2 border-black flex items-center justify-between text-black font-black text-xs uppercase tracking-wider">
                  <span>Buka Konverter</span>
                  <div className="w-6 h-6 border-2 border-black bg-white flex items-center justify-center group-hover:bg-[#FFE600] group-hover:translate-x-1 transition-all shadow-[1px_1px_0px_0px_#000000]">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// PAGE: CONVERTER HUB (SEARCH & CATEGORIES)
// ============================================================================
function ConverterHubPage({ navigateTo }: { navigateTo: (to: string) => void }) {
  const [search, setSearch] = useState('');

  const getFlatColor = (id: string) => {
    switch(id) {
      case 'documents': return 'bg-[#FFE600]'; // Yellow
      case 'images': return 'bg-[#86EFAC]'; // Green
      case 'video': return 'bg-[#FFA8E8]'; // Pink
      case 'audio': return 'bg-[#A5F3FC]'; // Cyan
      case 'spreadsheets': return 'bg-[#FFD0A3]'; // Peach
      case 'slides': return 'bg-[#FFE600]';
      case 'e-books': return 'bg-[#FFA8E8]';
      case 'archives': return 'bg-[#86EFAC]';
      case 'vector': return 'bg-[#A5F3FC]';
      case 'cad': return 'bg-[#FFD0A3]';
      case 'fonts': return 'bg-[#FFE600]';
      default: return 'bg-[#FFE600]';
    }
  };

  const filteredConverters = CONVERTERS.filter(conv => 
    conv.name.toLowerCase().includes(search.toLowerCase()) || 
    conv.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000]">
        <h1 className="text-4xl font-black uppercase font-display text-black tracking-tight">Converter Hub</h1>
        <p className="text-black font-semibold text-sm">Cari dan pilih jenis modul konversi file spesifik yang Anda butuhkan di bawah.</p>
        
        {/* Search bar */}
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-4 top-4 w-5 h-5 text-black stroke-[3]" />
          <input
            type="text"
            placeholder="Cari jenis file... (e.g., pdf, image, wav)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border-3 border-black bg-[#F4F3EF] text-black font-bold placeholder-black/50 shadow-[3px_3px_0px_0px_#000000] focus:bg-white focus:shadow-[5px_5px_0px_0px_#000000] transition-all rounded-none outline-none"
          />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <h2 className="text-2xl font-black uppercase font-display text-black">
            {search ? `Hasil Pencarian (${filteredConverters.length})` : 'Semua Modul Konverter'}
          </h2>
          <span className="bg-[#FFE600] border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000]">
            Pencarian Cepat
          </span>
        </div>
        
        {filteredConverters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredConverters.map((conv) => {
              const Icon = conv.icon;
              const flatColor = getFlatColor(conv.id);
              return (
                <div
                  key={conv.id}
                  onClick={() => navigateTo(conv.path)}
                  className="bg-white border-3 border-black p-5 shadow-[5px_5px_0px_0px_#000000] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000000] transition-all cursor-pointer flex items-start space-x-4"
                >
                  <div className={`w-12 h-12 shrink-0 border-3 border-black ${flatColor} flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000000]`}>
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg font-display uppercase tracking-tight text-black">{conv.name}</h3>
                    <p className="text-black/80 font-medium text-xs leading-relaxed">{conv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-3 border-black p-12 text-center space-y-4 shadow-[6px_6px_0px_0px_#000000]">
            <HelpCircle className="w-12 h-12 text-black stroke-[2.5] mx-auto" />
            <div className="space-y-1">
              <p className="font-black text-xl uppercase font-display text-black">Modul tidak ditemukan</p>
              <p className="text-xs text-black font-semibold">Silakan masukkan kata kunci pencarian lainnya.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: DOCUMENTS
// ============================================================================
function DocumentsConverter() {
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('Dokumen Baru');
  const [copied, setCopied] = useState(false);

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([inputText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadHtml = () => {
    const element = document.createElement("a");
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }</style></head><body><h1>${title}</h1><p>${inputText.replace(/\n/g, '<br>')}</p></body></html>`;
    const file = new Blob([htmlContent], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = `${title}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
          <FileText className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents Converter & Editor</h1>
          <p className="text-slate-500 text-xs">Buat dokumen teks, kompilasi ke TXT/HTML, dan ekstrak format dengan mudah.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit shadow-sm">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Properti Dokumen</h2>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Judul Dokumen</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            <span className="text-xs font-semibold text-slate-500 block">Ekspor Format</span>
            <button
              onClick={handleDownloadTxt}
              disabled={!inputText}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .TXT</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              disabled={!inputText}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-medium text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .HTML</span>
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Editor Konten</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                disabled={!inputText}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                title="Salin ke Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setInputText('')}
                disabled={!inputText}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-50 transition-colors"
                title="Hapus Konten"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Masukkan konten atau salin teks Anda di sini..."
            className="flex-1 w-full min-h-[300px] border border-slate-200 rounded-lg p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Karakter: {inputText.length}</span>
            <span>Kata: {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: IMAGES
// ============================================================================
function ImagesConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('image');
  const [format, setFormat] = useState('png');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [filter, setFilter] = useState('none');
  const [quality, setQuality] = useState(90);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name.substring(0, file.name.lastIndexOf('.')));
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageSrc(event.target?.result as string);
          setWidth(img.width);
          setHeight(img.height);
          setAspectRatio(img.width / img.height);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    setHeight(Math.round(val / aspectRatio));
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    setWidth(Math.round(val * aspectRatio));
  };

  const handleDownload = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        
        // Apply Filters
        if (filter === 'grayscale') {
          ctx.filter = 'grayscale(100%)';
        } else if (filter === 'sepia') {
          ctx.filter = 'sepia(100%)';
        } else if (filter === 'blur') {
          ctx.filter = 'blur(4px)';
        } else if (filter === 'invert') {
          ctx.filter = 'invert(100%)';
        } else {
          ctx.filter = 'none';
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Download
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const link = document.createElement('a');
        link.download = `${fileName}-converted.${format}`;
        link.href = canvas.toDataURL(mimeType, quality / 100);
        link.click();
      }
    };
    img.src = imageSrc;
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
          <ImageIcon className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Images Converter & Filter</h1>
          <p className="text-slate-500 text-xs">Ubah ukuran gambar, kompresi kualitas, sesuaikan format, dan beri efek filter.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Drop Zone */}
        <div className="md:col-span-2 space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />

          {!imageSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-500/40 bg-white hover:bg-slate-50/50 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Plus className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800">Pilih berkas gambar</p>
                <p className="text-xs text-slate-400">Dukung format JPG, PNG, WebP, SVG, GIF</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center min-h-[300px] relative group overflow-hidden">
              <img
                src={imageSrc}
                alt="Preview"
                style={{
                  filter: filter === 'grayscale' ? 'grayscale(100%)' :
                          filter === 'sepia' ? 'sepia(100%)' :
                          filter === 'blur' ? 'blur(4px)' :
                          filter === 'invert' ? 'invert(100%)' : 'none'
                }}
                className="max-h-[350px] object-contain rounded-lg shadow-sm"
              />
              <button
                onClick={() => setImageSrc(null)}
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-rose-600 text-white p-1.5 rounded-lg transition-colors"
                title="Hapus Gambar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar conversion details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm h-fit">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Pengaturan Gambar</h2>

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 block">Format Hasil</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="png">PNG (Lossless)</option>
                <option value="jpg">JPG (Lossy Compressed)</option>
                <option value="webp">WebP (Modern)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 block">Lebar (px)</label>
                <input
                  type="number"
                  value={width || ''}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  disabled={!imageSrc}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 block">Tinggi (px)</label>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  disabled={!imageSrc}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 block">Filter Efek</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                disabled={!imageSrc}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none"
              >
                <option value="none">Tanpa Filter</option>
                <option value="grayscale">Hitam Putih (Grayscale)</option>
                <option value="sepia">Klasik (Sepia)</option>
                <option value="blur">Blur (Meredam)</option>
                <option value="invert">Balik Warna (Invert)</option>
              </select>
            </div>

            {format === 'jpg' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Kualitas Ekspor</span>
                  <span>{quality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={!imageSrc}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={!imageSrc}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-indigo-100"
          >
            <Download className="w-4 h-4" />
            <span>Konversi & Unduh</span>
          </button>
        </div>
      </div>
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: VIDEO
// ============================================================================
function VideoConverter() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoSrc(URL.createObjectURL(file));
      setPlaying(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `frame-${Math.round(currentTime)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-sm">
          <Video className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Video Converter & Frame Extractor</h1>
          <p className="text-slate-500 text-xs">Putar video lokal, tonton metadata, dan tangkap frame gambar berkualitas tinggi secara instan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />

          {!videoSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-500/40 bg-white hover:bg-slate-50/50 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <Plus className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800">Pilih berkas video</p>
                <p className="text-xs text-slate-400">Dukung format MP4, WebM, OGG</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
              <video
                ref={videoRef}
                src={videoSrc}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                className="w-full max-h-[350px] bg-black rounded-xl"
              />

              {/* Video Player Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <span className="text-xs text-slate-500 font-mono">
                    {Math.round(currentTime)}s / {Math.round(duration)}s
                  </span>
                </div>

                <button
                  onClick={handleCaptureFrame}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tangkap Bingkai (.PNG)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 h-fit shadow-sm">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Metadata Video</h2>
          
          <div className="space-y-3.5 text-xs text-slate-500">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="font-semibold text-slate-400">Durasi</span>
              <span className="font-mono text-slate-800">{videoSrc ? `${Math.round(duration)} detik` : '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="font-semibold text-slate-400">Dimensi Resolusi</span>
              <span className="font-mono text-slate-800">{videoRef.current ? `${videoRef.current.videoWidth} x ${videoRef.current.videoHeight} px` : '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="font-semibold text-slate-400">Status</span>
              <span className="text-emerald-500 font-medium">{videoSrc ? 'Terbuka' : 'Kosong'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setVideoSrc(null);
                setPlaying(false);
              }}
              disabled={!videoSrc}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 font-medium text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Berkas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: AUDIO
// ============================================================================
function AudioConverter() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<any | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setTimer(0);
      intervalRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } catch (err) {
      alert("Izin mikrofon diperlukan untuk merekam.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
          <Music className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audio Recorder & Utility</h1>
          <p className="text-slate-500 text-xs">Rekam suara berkualitas tinggi dari mikrofon dan unduh ke format audio lokal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 shadow-sm min-h-[300px]">
          
          {recording ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Animated mic ripple */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center text-white">
                  <Mic className="w-8 h-8" />
                </div>
              </div>
              <span className="font-bold text-slate-800 text-lg">Perekaman Suara Aktif...</span>
              <span className="font-mono text-slate-500 text-sm">Timer: {timer} detik</span>
              
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-md"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Hentikan Rekam</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Mic className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1 max-w-xs">
                <p className="font-bold text-slate-800">Mulai Perekam Baru</p>
                <p className="text-xs text-slate-400">Ambil rekaman lisan atau memo audio kapan saja.</p>
              </div>

              <button
                onClick={startRecording}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-100"
              >
                <Mic className="w-4 h-4" />
                <span>Mulai Merekam</span>
              </button>
            </div>
          )}

          {/* Download captured recording */}
          {audioUrl && !recording && (
            <div className="w-full pt-6 border-t border-slate-100 mt-4 space-y-4 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hasil Rekaman Suara</span>
              <audio src={audioUrl} controls className="w-full max-w-md accent-indigo-600" />
              <a
                href={audioUrl}
                download="recording.wav"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Hasil (.WAV)</span>
              </a>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit shadow-sm text-xs text-slate-500">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Spesifikasi Format</h2>
          <p className="leading-relaxed">Aplikasi ini memproses input audio secara langsung melalui antarmuka standard <code className="bg-slate-50 px-1 py-0.5 rounded text-slate-700 font-mono">MediaStream</code> milik browser.</p>
          <div className="space-y-1.5 pt-2 border-t border-slate-50">
            <span className="font-semibold text-slate-600 block">Saluran Suara:</span>
            <span>Mono, disesuaikan dengan konfigurasi mikrofon Anda.</span>
          </div>
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-600 block">Kompatibilitas:</span>
            <span>Chrome, Safari, Firefox, Edge, dan Opera modern.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: SPREADSHEETS
// ============================================================================
function SpreadsheetsConverter() {
  const [data, setData] = useState<string[][]>([
    ['Nama', 'Kategori', 'Status', 'Skor'],
    ['Dokumen_Resmi.pdf', 'Documents', 'Selesai', '9.5'],
    ['Foto_Keluarga.png', 'Images', 'Selesai', '8.9'],
    ['Video_Prewed.mp4', 'Video', 'Memproses', '7.0'],
    ['Lagu_Tema.mp3', 'Audio', 'Gagal', '2.1']
  ]);

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const updated = [...data];
    updated[rowIndex][colIndex] = val;
    setData(updated);
  };

  const handleAddRow = () => {
    const colsCount = data[0]?.length || 4;
    setData([...data, Array(colsCount).fill('')]);
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spreadsheet-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const headers = data[0];
    const rows = data.slice(1);
    const jsonArr = rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header || `Kolom_${index + 1}`] = row[index] || '';
      });
      return obj;
    });

    const file = new Blob([JSON.stringify(jsonArr, null, 2)], {type: 'application/json'});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "spreadsheet-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
          <Table className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spreadsheets Converter & Table</h1>
          <p className="text-slate-500 text-xs">Ubah tabel data instan, edit sel spreadsheet, lalu ekspor ke CSV atau JSON.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Spreadsheet Header */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddRow}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
            <button
              onClick={() => setData([['Kolom 1', 'Kolom 2', 'Kolom 3'], ['', '', '']])}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-rose-600 font-medium text-xs hover:bg-rose-50/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Tabel</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor ke .CSV</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor ke .JSON</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
              <tr>
                {data[0]?.map((col, index) => (
                  <th key={index} className="p-3 border-r border-slate-200 min-w-[120px]">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => handleCellChange(0, index, e.target.value)}
                      className="w-full bg-transparent border-none outline-none font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500/30 rounded"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50/40">
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="p-2 border-r border-slate-150">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex + 1, colIndex, e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-slate-600 focus:ring-1 focus:ring-indigo-500/20 px-1 py-0.5 rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: SLIDES
// ============================================================================
function SlidesConverter() {
  const [markdown, setMarkdown] = useState(`# Slide Kesatu\nSelamat datang di pembuat presentasi kilat SaveTheFile.\n\n---\n\n# Slide Kedua\nSemua slide dibuat sepenuhnya di browser Anda dengan kode interaktif.\n\n---\n\n# Slide Ketiga\nTekan navigasi di bawah untuk berganti halaman slide Anda!`);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides = markdown.split(/\n?---\n?/).map(slide => slide.trim()).filter(Boolean);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
          <Presentation className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Slides Creator & Presentation</h1>
          <p className="text-slate-500 text-xs">Ubah draf tulisan Markdown biasa menjadi sebuah presentasi presentasi tayangan slide interaktif.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
          <div className="space-y-1">
            <h2 className="font-bold text-slate-950 text-sm">Editor Slide (Markdown)</h2>
            <p className="text-xs text-slate-400">Gunakan garis pemisah <code className="bg-slate-50 px-1 py-0.5 rounded font-mono">---</code> untuk memisahkan setiap lembar slide.</p>
          </div>

          <textarea
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setCurrentSlideIndex(0);
            }}
            className="flex-1 w-full min-h-[250px] border border-slate-200 rounded-lg p-3 text-sm font-mono focus:outline-none"
          />
        </div>

        {/* Live Presentation Preview */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[300px] relative">
          
          {/* Active slide content */}
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="space-y-4"
              >
                {slides[currentSlideIndex] ? (
                  slides[currentSlideIndex].split('\n').map((line, lIdx) => {
                    if (line.startsWith('# ')) {
                      return <h3 key={lIdx} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-indigo-400">{line.replace('# ', '')}</h3>;
                    }
                    return <p key={lIdx} className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">{line}</p>;
                  })
                ) : (
                  <p className="text-slate-500">Slide Kosong</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide Navigation footer */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Slide {currentSlideIndex + 1} dari {slides.length}</span>
            <div className="flex space-x-2">
              <button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                Lanjut
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: E-BOOKS
// ============================================================================
function EbooksConverter() {
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('sepia');
  const [text, setText] = useState(`JUDUL BUKU: Petualangan Hebat SaveTheFile\n\nBAB I: Menjelajah Masa Depan tanpa Batasan Server\n\nDi suatu masa di mana privasi menjadi harta yang paling berharga, seorang pengembang perangkat lunak bertekad untuk menciptakan sebuah toolkit konversi file legendaris. Ia tidak menyukai ide file dokumen pengguna harus diunggah ke cloud berukuran raksasa. Baginya, data adalah milik berdaulat setiap individu.\n\n"Semua harus berjalan secara lokal," pikirnya. Dengan memanfaatkan API standard modern browser, mulailah sebuah arsitektur SaveTheFile dikembangkan.`);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200); // 200 kata per menit

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
          <BookOpen className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-books Reader & Text Formatter</h1>
          <p className="text-slate-500 text-xs">Atur tata letak buku, sesuaikan fonta serif, hitung estimasi waktu baca, dan pratinjau buku.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm h-fit">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Format Buku</h2>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 block">Tema Pembaca</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  theme === 'light' ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Terang
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  theme === 'sepia' ? 'bg-[#fcf8f2] border-amber-600 text-amber-800' : 'bg-[#fcf8f2] border-slate-200 text-amber-700'
                }`}
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Gelap
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Ukuran Teks</span>
              <span>{fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-400 leading-normal">
            <div className="flex justify-between">
              <span>Jumlah Kata:</span>
              <span className="font-semibold text-slate-700">{wordCount} kata</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu Baca:</span>
              <span className="font-semibold text-slate-700">~{readingTime} menit</span>
            </div>
          </div>
        </div>

        {/* Ebook Frame Preview */}
        <div className="md:col-span-2 flex flex-col space-y-4">
          <div className={`flex-1 rounded-2xl p-6 shadow-sm border transition-colors min-h-[350px] ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' :
            theme === 'sepia' ? 'bg-[#fdf9f4] border-amber-100 text-amber-950 font-serif' :
            'bg-slate-950 border-slate-800 text-slate-200'
          }`}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ fontSize: `${fontSize}px` }}
              className="w-full h-full bg-transparent border-none outline-none resize-none leading-relaxed min-h-[300px] focus:ring-0"
              placeholder="Ketik draf isi buku Anda di sini..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: ARCHIVES
// ============================================================================
interface VirtualFile {
  name: string;
  size: number;
}

function ArchivesConverter() {
  const [files, setFiles] = useState<VirtualFile[]>([
    { name: 'resume_kerja.pdf', size: 1024 * 340 },
    { name: 'ikon_logo.png', size: 1024 * 12 },
    { name: 'lagu_instrumental.wav', size: 1024 * 1024 * 4.5 }
  ]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState(10); // dalam KB

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;
    const sizeInBytes = newFileSize * 1024;
    setFiles([...files, { name: newFileName, size: sizeInBytes }]);
    setNewFileName('');
  };

  const handleDeleteFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-500 to-zinc-600 flex items-center justify-center text-white shadow-sm">
          <Archive className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Archives Virtual Bundler</h1>
          <p className="text-slate-500 text-xs">Simulasi pengepakan file dan buat arsip bundel virtual sepenuhnya di browser.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workspace Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm h-fit">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Tambah File ke Bundel</h2>
          
          <form onSubmit={handleAddFile} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">Nama File</label>
              <input
                type="text"
                placeholder="misal: dokumen.xlsx"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 block">Ukuran File (KB)</label>
              <input
                type="number"
                min="1"
                value={newFileSize}
                onChange={(e) => setNewFileSize(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Masukkan ke Arsip</span>
            </button>
          </form>
        </div>

        {/* Files list */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-950 text-sm">Isi Paket Arsip Virtual</h2>
            <span className="text-xs text-slate-400 font-medium">Total: {files.length} berkas</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto pr-2">
            {files.length > 0 ? (
              files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4.5 h-4.5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">Arsip kosong. Masukkan file untuk memulai paket.</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="text-xs text-slate-500">
              Estimasi ukuran arsip: <span className="font-bold font-mono text-slate-800">{formatSize(files.reduce((a, b) => a + b.size, 0))}</span>
            </div>
            <button
              onClick={() => alert("Simulasi: File arsip virtual .ZIP berhasil dibuat secara lokal!")}
              disabled={files.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Kompilasi & Unduh .ZIP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: VECTOR
// ============================================================================
function VectorConverter() {
  const [bgColor, setBgColor] = useState('#6366f1');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [scale, setScale] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300 * scale;
      canvas.height = 300 * scale;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = 'vector-render.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-sm">
          <PenTool className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vector Converter & SVG Renderer</h1>
          <p className="text-slate-500 text-xs">Ubah gambar vektor SVG menjadi format raster PNG dengan ketajaman yang dapat disesuaikan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm h-fit">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Atribut SVG</h2>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Warna Latar Belakang</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-9 rounded border border-slate-200 p-0.5 cursor-pointer focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Warna Garis Stroke</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-full h-9 rounded border border-slate-200 p-0.5 cursor-pointer focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Ketebalan Garis</span>
              <span>{strokeWidth}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 block">Skala Render PNG</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    scale === s ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {s}x ({300 * s}px)
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDownloadPng}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor sebagai PNG</span>
          </button>
        </div>

        {/* Vector Preview Canvas */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gambar Vektor Hasil Render</span>
          
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 flex items-center justify-center shadow-inner">
            {/* Live custom render SVG based on variables */}
            <svg
              ref={svgRef}
              width="220"
              height="220"
              viewBox="0 0 100 100"
              className="transition-colors duration-200"
            >
              <rect x="10" y="10" width="80" height="80" rx="15" fill={bgColor} />
              {/* Inner shape */}
              <circle
                cx="50"
                cy="50"
                r="25"
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <path
                d="M40 50 L47 57 L60 43"
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: CAD
// ============================================================================
interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function CadConverter() {
  const [lines, setLines] = useState<LineData[]>([
    { x1: 20, y1: 20, x2: 180, y2: 20 },
    { x1: 180, y1: 20, x2: 180, y2: 180 },
    { x1: 180, y1: 180, x2: 20, y2: 180 },
    { x1: 20, y1: 180, x2: 20, y2: 20 },
  ]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [drawMode, setDrawMode] = useState(true);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (startPoint === null) {
      setStartPoint({ x, y });
    } else {
      setLines([...lines, { x1: startPoint.x, y1: startPoint.y, x2: x, y2: y }]);
      setStartPoint(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setMousePos({ x, y });
  };

  const handleDownloadDXF = () => {
    // Basic DXF content generation
    let dxf = "0\nSECTION\n2\nENTITIES\n";
    lines.forEach(line => {
      dxf += "0\nLINE\n8\n0\n10\n" + line.x1 + "\n20\n" + line.y1 + "\n11\n" + line.x2 + "\n21\n" + line.y2 + "\n";
    });
    dxf += "0\nENDSEC\n0\nEOF\n";

    const file = new Blob([dxf], { type: 'application/dxf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'cad-drawing.dxf';
    link.click();
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
          <PenTool className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CAD Interactive Canvas & DXF Exporter</h1>
          <p className="text-slate-500 text-xs">Kanvas gambar vektor CAD sederhana, rancang desain lokal, lalu ekspor sebagai berkas DXF standard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm h-fit">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Modul CAD</h2>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                setDrawMode(!drawMode);
                setStartPoint(null);
              }}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                drawMode ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span>{drawMode ? 'Mode Menggambar Aktif' : 'Menggambar Dinonaktifkan'}</span>
            </button>
            <button
              onClick={() => {
                setLines([]);
                setStartPoint(null);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Garis</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadDXF}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor ke .DXF</span>
            </button>
          </div>
        </div>

        {/* CAD Drafting board */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col items-center">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Papan Gambar CAD (Grid 250x250)</span>
            {mousePos && (
              <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                X: {mousePos.x} Y: {mousePos.y}
              </span>
            )}
          </div>

          <svg
            width="250"
            height="250"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            className="border-2 border-indigo-500/10 rounded-xl cursor-crosshair bg-slate-950 shadow-inner relative"
          >
            {/* Grid Pattern lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="250" stroke="#1e293b" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 25} x2="250" y2={i * 25} stroke="#1e293b" strokeWidth="0.5" />
            ))}

            {/* Render lines */}
            {lines.map((line, idx) => (
              <line
                key={idx}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#6366f1"
                strokeWidth="2"
              />
            ))}

            {/* Render temporary line when drawing */}
            {startPoint && mousePos && (
              <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: FONTS
// ============================================================================
function FontsConverter() {
  const [testText, setTestText] = useState('SaveTheFile - Uji Coba Pratinjau Fonta');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('normal');
  const [lineHeight, setLineHeight] = useState(1.4);
  const [customFontFamily, setCustomFontFamily] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fontDataUrl = event.target?.result as string;
        const fontName = 'UploadedCustomFont';
        
        try {
          const fontFace = new FontFace(fontName, `url(${fontDataUrl})`);
          await fontFace.load();
          document.fonts.add(fontFace);
          setCustomFontFamily(fontName);
        } catch (err) {
          alert("Gagal memuat fonta. Pastikan format file TTF, OTF, atau WOFF valid.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3.5 border-b border-slate-100 pb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
          <Type className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fonts Tester & Pratinjau</h1>
          <p className="text-slate-500 text-xs">Muat file font (TTF, OTF, WOFF) lokal secara instan dan uji coba visual penulisan teks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm h-fit">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Muat Fonta</h2>
          
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFontUpload}
            ref={fileInputRef}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Pilih Berkas Fonta</span>
          </button>

          <div className="space-y-1.5 pt-2 border-t border-slate-50">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Ukuran Teks</span>
              <span>{fontSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Ketebalan</span>
              <span className="capitalize">{fontWeight}</span>
            </div>
            <select
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="normal">Reguler (Normal)</option>
              <option value="bold">Tebal (Bold)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Spasi Baris</span>
              <span>{lineHeight}</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Interactive writing test board */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lembar Pratinjau Fonta</span>
            {customFontFamily ? (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Fonta Kustom Aktif
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">
                Menggunakan Fonta Bawaan
              </span>
            )}
          </div>

          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            style={{
              fontFamily: customFontFamily ? 'UploadedCustomFont, sans-serif' : 'inherit',
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              lineHeight: lineHeight
            }}
            className="flex-1 w-full min-h-[220px] border border-slate-200 rounded-lg p-3.5 focus:outline-none leading-normal resize-none"
            placeholder="Ketik sesuatu di sini untuk menguji coba fonta yang Anda unggah..."
          />
        </div>
      </div>
    </div>
  );
}
