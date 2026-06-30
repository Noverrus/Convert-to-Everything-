import React, { useState, useEffect, useRef } from 'react';
import { 
  AnimatePresence, 
  motion 
} from 'framer-motion';
import { 
  Menu, X, Home, FileText, Image as ImageIcon, 
  Video, Music, Table, Presentation, BookOpen, Archive, PenTool, Type, 
  ShieldCheck, Zap, Plus, Trash2, Check, Search, HelpCircle, ArrowRight
} from 'lucide-react';

// ==========================================
// 1. LIGHTWEIGHT SPA ROUTER
// ==========================================
interface LinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Helper to get path from hash
const getPathFromHash = (): string => {
  const hash = window.location.hash;
  if (!hash) return '/';
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  return normalized.startsWith('/') ? normalized : '/' + normalized;
};

const Link: React.FC<LinkProps> = ({ to, children, className, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = to;
    if (onClick) onClick();
  };
  return (
    <a href={'#' + to} onClick={handleClick} className={className}>
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
  descId: string;
  descEn: string;
  color: string;
}

const CONVERTERS: ConverterInfo[] = [
  { id: 'documents', path: '/converter/documents', name: 'Documents Converter', icon: FileText, descId: 'Konversi teks, PDF, buat file dokumen kustom secara privat.', descEn: 'Convert text, PDFs, and create custom documents privately.', color: 'from-blue-500 to-indigo-600' },
  { id: 'images', path: '/converter/images', name: 'Images Converter', icon: ImageIcon, descId: 'Ubah format gambar, kompres, sesuaikan ukuran tanpa server eksternal.', descEn: 'Change image formats, compress, and resize without external servers.', color: 'from-emerald-500 to-teal-600' },
  { id: 'video', path: '/converter/video', name: 'Video Converter', icon: Video, descId: 'Proses video secara lokal, ekstrak bingkai visual, dan kelola resolusi.', descEn: 'Process video locally, extract frames, and manage resolution.', color: 'from-rose-500 to-pink-600' },
  { id: 'audio', path: '/converter/audio', name: 'Audio Converter', icon: Music, descId: 'Rekam, potong durasi audio, dan kelola kualitas suara instan.', descEn: 'Record, trim audio duration, and manage sound quality instantly.', color: 'from-violet-500 to-purple-600' },
  { id: 'spreadsheets', path: '/converter/spreadsheets', name: 'Spreadsheets Converter', icon: Table, descId: 'Edit tabel data secara lokal, ubah format CSV ke JSON dan sebaliknya.', descEn: 'Edit tables locally, convert CSV to JSON and vice-versa.', color: 'from-green-500 to-emerald-600' },
  { id: 'slides', path: '/converter/slides', name: 'Slides Converter', icon: Presentation, descId: 'Ubah naskah tulisan Markdown menjadi tayangan presentasi modern.', descEn: 'Turn Markdown scripts into modern interactive slides.', color: 'from-amber-500 to-orange-600' },
  { id: 'ebooks', path: '/converter/e-books', name: 'E-books Converter', icon: BookOpen, descId: 'Format ulang teks e-book kustom dan sesuaikan statistik membaca.', descEn: 'Reformat custom e-book texts and manage reading statistics.', color: 'from-cyan-500 to-blue-600' },
  { id: 'archives', path: '/converter/archives', name: 'Archives Converter', icon: Archive, descId: 'Buat bundel arsip lokal .zip atau ekstrak folder lokal aman.', descEn: 'Create local .zip archives or extract secure local folders.', color: 'from-slate-500 to-zinc-600' },
  { id: 'vector', path: '/converter/vector', name: 'Vector Converter', icon: PenTool, descId: 'Render format gambar SVG menjadi PNG, edit properti vektor.', descEn: 'Render SVG formats into PNG images, and edit vector parameters.', color: 'from-pink-500 to-rose-600' },
  { id: 'cad', path: '/converter/cad', name: 'CAD Converter', icon: PenTool, descId: 'Gambar desain arsitektur/teknik CAD lokal dan ekspor ke DXF/SVG.', descEn: 'Draw local architectural/engineering CAD designs and export to DXF/SVG.', color: 'from-sky-500 to-blue-600' },
  { id: 'fonts', path: '/converter/fonts', name: 'Fonts Converter', icon: Type, descId: 'Unggah berkas fonta TTF/WOFF Anda, uji visualisasi pengetikan.', descEn: 'Upload your TTF/WOFF font files, and test typing visualization.', color: 'from-fuchsia-500 to-purple-600' },
];

// ==========================================
// 3. TRANSLATIONS DICTIONARY
// ==========================================
const TRANSLATIONS = {
  id: {
    heroBadge: "Lokal & 100% Privat",
    heroTitle1: "Konversi File",
    heroTitle2: "Lokal & Instan",
    heroDesc: "SaveTheFile memproses seluruh dokumen, gambar, audio, presentasi, dan font secara lokal langsung di dalam browser Anda. Tidak ada data yang diunggah ke server eksternal mana pun. Privasi total dengan performa kilat.",
    exploreBtn: "jelajahi hub converter",
    converterTitle: "Pilih Modul Konversi",
    converterSubtitle: "Toolkit pengolah file offline instan dan aman.",
    activeBadge: "11 Modul Aktif",
    openConverterBtn: "Buka Konverter",
    
    // Future features
    upcomingTitle1: "Alat Teks AI",
    upcomingDesc1: "Deteksi konten, peringkasan cerdas, dan parafrase teks langsung di dalam browser.",
    upcomingTitle2: "Modul Skrip Kustom",
    upcomingDesc2: "Tulis skrip konversi file JavaScript Anda sendiri dan jalankan secara aman.",
    upcomingBadge: "Segera Hadir",
    moreFeaturesBadge: "Fitur Mendatang",

    // Hub
    hubTitle: "Converter Hub",
    hubSubtitle: "Cari dan pilih jenis modul konversi file spesifik yang Anda butuhkan di bawah.",
    searchPlaceholder: "Cari jenis file... (e.g., pdf, image, wav)",
    allModules: "Semua Modul Konverter",
    searchResults: "Hasil Pencarian",
    searchQuick: "Pencarian Cepat",
    noModule: "Modul tidak ditemukan",
    noModuleDesc: "Silakan masukkan kata kunci pencarian lainnya.",

    // Placeholder
    dropTitle: "Pilih atau Seret Berkas Anda",
    dropSubtitle: "Mendukung format file terkait",
    selectBtn: "Pilih Berkas",
    statusTitle: "Status Berkas:",
    statusDesc: "berhasil dimuat secara lokal. Silakan bimbing saya untuk membuat fungsi konversi spesifik yang Anda inginkan untuk berkas ini!",
    guideTitle: "Bimbing Saya!",
    guideDesc: "Fungsi konversi halaman ini sengaja dikosongkan agar kita bisa membangunnya bersama dari awal.",
    guideStep1: "Tentukan input & output yang diinginkan.",
    guideStep2: "Tulis instruksi di kolom chat samping.",
    guideStep3: "Saya akan mengimplementasikan kodenya secara bertahap sesuai keinginan Anda!",

    // Footer static pages titles & contents
    aboutTitle: "Tentang Kami",
    privacyTitle: "Kebijakan Privasi",
    termsTitle: "Syarat Ketentuan",
    contactTitle: "Hubungi Kami",
    backToHome: "Kembali ke Beranda",
    copyright: "©2026 NoverrusDev\nHak cipta dilindungi undang-undang",
    footerPitch: "Semua konversi file terjadi langsung di browser Anda menggunakan Web APIs, Canvas, AudioContext, dan Web Assembly lokal. File Anda aman dan tidak pernah dikirim ke server."
  },
  en: {
    heroBadge: "Local & 100% Private",
    heroTitle1: "File Converter",
    heroTitle2: "Local & Instant",
    heroDesc: "SaveTheFile processes all documents, images, audio, presentations, and fonts locally right inside your browser. No data is uploaded to any external server. Complete privacy with lightning speed.",
    exploreBtn: "Explore Converter Hub",
    converterTitle: "Select Converter Module",
    converterSubtitle: "Instant and secure offline file processing toolkit.",
    activeBadge: "11 Active Modules",
    openConverterBtn: "Open Converter",

    // Future features
    upcomingTitle1: "AI Text Tool",
    upcomingDesc1: "Content detection, smart summarization, and text paraphrasing directly in your browser.",
    upcomingTitle2: "Custom Script Module",
    upcomingDesc2: "Write your own JavaScript file conversion scripts and execute them securely.",
    upcomingBadge: "Coming Soon",
    moreFeaturesBadge: "Upcoming Features",

    // Hub
    hubTitle: "Converter Hub",
    hubSubtitle: "Search and choose the specific file converter module you need below.",
    searchPlaceholder: "Search file types... (e.g., pdf, image, wav)",
    allModules: "All Converter Modules",
    searchResults: "Search Results",
    searchQuick: "Quick Search",
    noModule: "Module not found",
    noModuleDesc: "Please enter another search keyword.",

    // Placeholder
    dropTitle: "Select or Drag Your File",
    dropSubtitle: "Supports related file formats",
    selectBtn: "Choose File",
    statusTitle: "File Status:",
    statusDesc: "successfully loaded locally. Please guide me to create the specific conversion function you want for this file!",
    guideTitle: "Guide Me!",
    guideDesc: "This page's conversion function is intentionally left blank so we can build it together from scratch.",
    guideStep1: "Determine your desired input & output.",
    guideStep2: "Write instructions in the chat on the side.",
    guideStep3: "I will implement the code step-by-step according to your preferences!",

    // Footer static pages titles & contents
    aboutTitle: "About Us",
    privacyTitle: "Privacy Policy",
    termsTitle: "Terms of Service",
    contactTitle: "Contact Us",
    backToHome: "Back to Home",
    copyright: "©2026 NoverrusDev\nAll rights reserved",
    footerPitch: "All file conversions happen directly in your browser using local Web APIs, Canvas, AudioContext, and Web Assembly. Your files are safe and never sent to any server."
  }
};

export default function App() {
  const [path, setPath] = useState(getPathFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Persistent Language State (Defaulting to Indonesian "id" as requested)
  const [lang, setLang] = useState<'id' | 'en'>(() => {
    const saved = localStorage.getItem('savethefile_lang');
    return (saved === 'en' || saved === 'id') ? saved : 'id';
  });

  const toggleLang = (newLang: 'id' | 'en') => {
    setLang(newLang);
    localStorage.setItem('savethefile_lang', newLang);
  };

  useEffect(() => {
    const handleHashChange = () => {
      setPath(getPathFromHash());
    };

    // Redirect direct pathname landings to hash routes for 100% 404 resilience on Vercel
    const pathname = window.location.pathname;
    if (pathname !== '/' && pathname !== '/index.html' && !window.location.hash) {
      window.location.replace('/#' + pathname);
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Helper navigation function
  const navigateTo = (to: string) => {
    window.location.hash = to;
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F3EF] text-black font-sans selection:bg-[#FFE600] selection:text-black">
      
      {/* ==========================================
          HEADER BAR
         ========================================== */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-black py-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Name on Left */}
          <Link to="/" onClick={() => navigateTo('/')} className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            {/* Custom Neo-brutalist Placeholder Logo */}
            <div className="w-11 h-11 border-3 border-black bg-[#FFE600] flex items-center justify-center text-black shadow-[3px_3px_0px_0px_#000000] rotate-[-2deg] shrink-0 relative overflow-hidden group">
              <span className="font-black text-lg tracking-tighter select-none group-hover:scale-110 transition-transform">STF</span>
              {/* Corner accent flap */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-black transform rotate-45 translate-x-1.5 translate-y-[-1.5px]" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-black font-display uppercase">SaveTheFile</span>
          </Link>

          {/* Lang Selector & Hamburger Button Group */}
          <div className="flex items-center space-x-4">
            
            {/* Language Switcher Toggle Buttons */}
            <div className="flex border-3 border-black bg-white shadow-[3px_3px_0px_0px_#000000] overflow-hidden rounded-xl text-xs font-black shrink-0 select-none">
              <button
                onClick={() => toggleLang('id')}
                className={`px-3 py-2 transition-all uppercase ${lang === 'id' ? 'bg-[#FFE600] text-black font-extrabold' : 'bg-white text-black/60 hover:text-black hover:bg-gray-100'}`}
              >
                ID
              </button>
              <div className="w-[3px] bg-black shrink-0" />
              <button
                onClick={() => toggleLang('en')}
                className={`px-3 py-2 transition-all uppercase ${lang === 'en' ? 'bg-[#FFE600] text-black font-extrabold' : 'bg-white text-black/60 hover:text-black hover:bg-gray-100'}`}
              >
                EN
              </button>
            </div>

            {/* Hamburger Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 border-3 border-black bg-[#A5F3FC] text-black font-black shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000000] transition-all cursor-pointer rounded-xl focus:outline-none"
              aria-label="Buka Menu"
            >
              {menuOpen ? <X className="w-6 h-6 stroke-[3]" /> : <Menu className="w-6 h-6 stroke-[3]" />}
            </button>
          </div>
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
                <span className="font-extrabold text-xl text-black font-display uppercase tracking-tight">
                  {lang === 'id' ? 'Menu Navigasi' : 'Navigation'}
                </span>
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
                  onClick={() => navigateTo('/')}
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
                  onClick={() => navigateTo('/converter')}
                  className={`flex items-center space-x-3 px-4 py-3 border-3 border-black rounded-xl transition-all ${
                    path === '/converter' 
                      ? 'bg-[#FFE600] text-black font-bold shadow-[4px_4px_0px_0px_#000000]' 
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000000]'
                  }`}
                >
                  <Zap className="w-5 h-5 stroke-[2.5]" />
                  <span className="font-display font-extrabold">Converter Hub</span>
                </Link>

                {/* Info links listed directly as requested */}
                <div className="pt-4 border-t-2 border-black/20 mt-4 space-y-3">
                  <p className="text-[10px] font-black uppercase text-black/50 px-1 tracking-wider">
                    {lang === 'id' ? 'INFORMASI' : 'INFORMATION'}
                  </p>
                  
                  <Link 
                    to="/about" 
                    onClick={() => navigateTo('/about')}
                    className={`flex items-center space-x-3 px-4 py-2.5 border-2 border-black rounded-lg text-xs font-black uppercase transition-all ${
                      path === '/about'
                        ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000000]'
                        : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_#000000] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0px_0px_#000000]'
                    }`}
                  >
                    <span>{lang === 'id' ? 'Tentang Kami' : 'About Us'}</span>
                  </Link>

                  <Link 
                    to="/privacy" 
                    onClick={() => navigateTo('/privacy')}
                    className={`flex items-center space-x-3 px-4 py-2.5 border-2 border-black rounded-lg text-xs font-black uppercase transition-all ${
                      path === '/privacy'
                        ? 'bg-[#86EFAC] text-black shadow-[2px_2px_0px_0px_#000000]'
                        : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_#000000] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0px_0px_#000000]'
                    }`}
                  >
                    <span>{lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}</span>
                  </Link>

                  <Link 
                    to="/terms" 
                    onClick={() => navigateTo('/terms')}
                    className={`flex items-center space-x-3 px-4 py-2.5 border-2 border-black rounded-lg text-xs font-black uppercase transition-all ${
                      path === '/terms'
                        ? 'bg-[#FFA8E8] text-black shadow-[2px_2px_0px_0px_#000000]'
                        : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_#000000] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0px_0px_#000000]'
                    }`}
                  >
                    <span>{lang === 'id' ? 'Syarat Ketentuan' : 'Terms of Service'}</span>
                  </Link>

                  <Link 
                    to="/contact" 
                    onClick={() => navigateTo('/contact')}
                    className={`flex items-center space-x-3 px-4 py-2.5 border-2 border-black rounded-lg text-xs font-black uppercase transition-all ${
                      path === '/contact'
                        ? 'bg-[#A5F3FC] text-black shadow-[2px_2px_0px_0px_#000000]'
                        : 'bg-white text-black shadow-[1.5px_1.5px_0px_0px_#000000] hover:translate-y-[-0.5px] hover:shadow-[2px_2px_0px_0px_#000000]'
                    }`}
                  >
                    <span>{lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}</span>
                  </Link>
                </div>
              </div>

              <div className="p-5 border-t-3 border-black bg-[#86EFAC] text-black font-bold flex items-center space-x-2.5 text-xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span className="font-display font-extrabold uppercase tracking-wider">
                  {lang === 'id' ? '100% Client-Side & Privat' : '100% Client-Side & Private'}
                </span>
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
            return <HomePage lang={lang} navigateTo={navigateTo} />;
          } else if (path === '/converter') {
            return <ConverterHubPage lang={lang} navigateTo={navigateTo} />;
          } else if (path === '/converter/documents') {
            return <DocumentsConverter lang={lang} />;
          } else if (path === '/converter/images') {
            return <ImagesConverter lang={lang} />;
          } else if (path === '/converter/video') {
            return <VideoConverter lang={lang} />;
          } else if (path === '/converter/audio') {
            return <AudioConverter lang={lang} />;
          } else if (path === '/converter/spreadsheets') {
            return <SpreadsheetsConverter lang={lang} />;
          } else if (path === '/converter/slides') {
            return <SlidesConverter lang={lang} />;
          } else if (path === '/converter/e-books') {
            return <EbooksConverter lang={lang} />;
          } else if (path === '/converter/archives') {
            return <ArchivesConverter lang={lang} />;
          } else if (path === '/converter/vector') {
            return <VectorConverter lang={lang} />;
          } else if (path === '/converter/cad') {
            return <CadConverter lang={lang} />;
          } else if (path === '/converter/fonts') {
            return <FontsConverter lang={lang} />;
          } else if (path === '/about') {
            return <AboutPage lang={lang} navigateTo={navigateTo} />;
          } else if (path === '/privacy') {
            return <PrivacyPage lang={lang} navigateTo={navigateTo} />;
          } else if (path === '/terms') {
            return <TermsPage lang={lang} navigateTo={navigateTo} />;
          } else if (path === '/contact') {
            return <ContactPage lang={lang} navigateTo={navigateTo} />;
          } else {
            // Fallback to Home
            return <HomePage lang={lang} navigateTo={navigateTo} />;
          }
        })()}
      </main>

      {/* ==========================================
          FOOTER WITH REDIRECT LINKS & COPYRIGHT
         ========================================== */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 border-t-4 border-black text-center text-sm">
        <div className="max-w-7xl mx-auto space-y-6">
          <p className="font-extrabold text-white text-lg tracking-wider uppercase font-display">SaveTheFile</p>
          
          <p className="max-w-xl mx-auto text-slate-400 text-xs leading-relaxed">
            {TRANSLATIONS[lang].footerPitch}
          </p>

          {/* Footer redirect links as explicitly requested */}
          <div className="flex flex-wrap justify-center items-center gap-6 py-2 border-y border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
            <button 
              onClick={() => navigateTo('/about')} 
              className="hover:text-[#FFE600] transition-colors"
            >
              {lang === 'id' ? 'About Us' : 'About Us'}
            </button>
            <button 
              onClick={() => navigateTo('/privacy')} 
              className="hover:text-[#86EFAC] transition-colors"
            >
              {lang === 'id' ? 'Privacy Policy' : 'Privacy Policy'}
            </button>
            <button 
              onClick={() => navigateTo('/terms')} 
              className="hover:text-[#FFA8E8] transition-colors"
            >
              {lang === 'id' ? 'Terms' : 'Terms'}
            </button>
            <button 
              onClick={() => navigateTo('/contact')} 
              className="hover:text-[#A5F3FC] transition-colors"
            >
              {lang === 'id' ? 'Contact Us' : 'Contact Us'}
            </button>
          </div>

          {/* Copyright Section */}
          <div className="pt-2 text-center text-xs text-slate-500 max-w-xl mx-auto">
            <div className="whitespace-pre-line font-medium text-slate-400 leading-relaxed">
              {TRANSLATIONS[lang].copyright}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// PAGE: HOME PAGE
// ============================================================================
function HomePage({ lang, navigateTo }: { lang: 'id' | 'en'; navigateTo: (to: string) => void }) {
  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-16 flex flex-col items-center">
      
      {/* Hero Section - Centered for pristine visual layout */}
      <section className="text-center py-6 space-y-6 flex flex-col items-center w-full">
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center space-x-2 px-4 py-2 border-3 border-black bg-[#86EFAC] text-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000]"
        >
          <ShieldCheck className="w-4 h-4 stroke-[3]" />
          <span className="font-display font-extrabold tracking-wider">
            {TRANSLATIONS[lang].heroBadge}
          </span>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black leading-[1.15] font-display uppercase text-center"
        >
          {lang === 'id' ? 'Konversi File' : 'File Converter'} <br />
          <span className="bg-[#FFE600] border-3 border-black px-4 py-1.5 inline-block rotate-[-1.5deg] shadow-[5px_5px_0px_0px_#000000] mt-3 mb-1">
            {TRANSLATIONS[lang].heroTitle2}
          </span>
        </motion.h1>

        {/* Description explaining benefits and features */}
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-black font-semibold max-w-2xl leading-relaxed bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000000] text-center"
        >
          {TRANSLATIONS[lang].heroDesc}
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-2"
        >
          <button 
            onClick={() => navigateTo('/converter')}
            className="inline-flex items-center space-x-2 px-8 py-4 border-4 border-black bg-[#FFE600] text-black font-black uppercase font-display tracking-wider shadow-[6px_6px_0px_0px_#000000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000000] transition-all cursor-pointer text-base rounded-none"
          >
            <span>{TRANSLATIONS[lang].exploreBtn}</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </motion.div>
      </section>

      {/* "Converter File" Box Section */}
      <section className="w-full pt-4 flex justify-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigateTo('/converter')}
          className="w-full max-w-2xl bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000] text-center space-y-4 cursor-pointer hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[11px_11px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[4px_4px_0px_0px_#000000] transition-all select-none group"
        >
          <div className="text-2xl sm:text-3xl font-black uppercase font-display text-black bg-[#A5F3FC] border-3 border-black py-3 px-6 inline-block rotate-[0.5deg] shadow-[4px_4px_0px_0px_#000000] group-hover:bg-[#FFE600] group-hover:rotate-[-1deg] transition-all">
            Converter File
          </div>
          <p className="text-black font-semibold text-sm sm:text-base leading-relaxed pt-2">
            {lang === 'id'
              ? 'Konversikan berkas dokumen, gambar, video, audio, spreadsheet, presentasi, e-book, arsip, vektor, CAD, dan font secara aman langsung di perangkat lokal Anda tanpa melibatkan pihak ketiga atau server cloud.'
              : 'Convert documents, images, videos, audio, spreadsheets, presentations, e-books, archives, vectors, CAD files, and fonts securely on your local device without third-party or cloud servers.'}
          </p>
        </motion.div>
      </section>

    </div>
  );
}

// ============================================================================
// PAGE: CONVERTER HUB (SEARCH & CATEGORIES)
// ============================================================================
function ConverterHubPage({ lang, navigateTo }: { lang: 'id' | 'en'; navigateTo: (to: string) => void }) {
  const [search, setSearch] = useState('');

  const getFlatColor = (id: string) => {
    switch(id) {
      case 'documents': return 'bg-[#FFE600]';
      case 'images': return 'bg-[#86EFAC]';
      case 'video': return 'bg-[#FFA8E8]';
      case 'audio': return 'bg-[#A5F3FC]';
      case 'spreadsheets': return 'bg-[#FFD0A3]';
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
    conv.descId.toLowerCase().includes(search.toLowerCase()) ||
    conv.descEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000]">
        <h1 className="text-4xl font-black uppercase font-display text-black tracking-tight">{TRANSLATIONS[lang].hubTitle}</h1>
        <p className="text-black font-semibold text-sm">{TRANSLATIONS[lang].hubSubtitle}</p>
        
        {/* Search bar */}
        <div className="relative max-w-md mx-auto mt-6">
          <Search className="absolute left-4 top-4 w-5 h-5 text-black stroke-[3]" />
          <input
            type="text"
            placeholder={TRANSLATIONS[lang].searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border-3 border-black bg-[#F4F3EF] text-black font-bold placeholder-black/50 shadow-[3px_3px_0px_0px_#000000] focus:bg-white focus:shadow-[5px_5px_0px_0px_#000000] transition-all rounded-none outline-none"
          />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <h2 className="text-2xl font-black uppercase font-display text-black">
            {search ? `${TRANSLATIONS[lang].searchResults} (${filteredConverters.length})` : TRANSLATIONS[lang].allModules}
          </h2>
          <span className="bg-[#FFE600] border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000]">
            {TRANSLATIONS[lang].searchQuick}
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
                    <p className="text-black/80 font-medium text-xs leading-relaxed">
                      {lang === 'id' ? conv.descId : conv.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-3 border-black p-12 text-center space-y-4 shadow-[6px_6px_0px_0px_#000000]">
            <HelpCircle className="w-12 h-12 text-black stroke-[2.5] mx-auto" />
            <div className="space-y-1">
              <p className="font-black text-xl uppercase font-display text-black">{TRANSLATIONS[lang].noModule}</p>
              <p className="text-xs text-black font-semibold">{TRANSLATIONS[lang].noModuleDesc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BASE CONVERTER PLACEHOLDER (NEO BRUTALIST STYLE)
// ============================================================================
interface BaseConverterPlaceholderProps {
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  badgeText: string;
  acceptedFileTypes?: string;
  lang: 'id' | 'en';
}

function BaseConverterPlaceholder({
  title,
  desc,
  icon: Icon,
  colorClass,
  badgeText,
  acceptedFileTypes = "*/*",
  lang
}: BaseConverterPlaceholderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-6">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 border-3 border-black ${colorClass} flex items-center justify-center text-black shadow-[3px_3px_0px_0px_#000000]`}>
            <Icon className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase font-display text-black tracking-tight">{title}</h1>
            <p className="text-black font-semibold text-sm opacity-90">{desc}</p>
          </div>
        </div>
        <div className="bg-[#FFE600] border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000] self-start md:self-center">
          {badgeText}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Workspace Card */}
        <div className="md:col-span-8 space-y-6">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-4 border-black bg-white p-8 text-center shadow-[6px_6px_0px_0px_#000000] transition-all min-h-[300px] flex flex-col items-center justify-center relative ${
              isDragging ? 'bg-cyan-50 border-dashed' : ''
            }`}
          >
            {/* Input Element */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              className="hidden" 
            />

            {!selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 border-3 border-black bg-[#A5F3FC] flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#000000]">
                  <Plus className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-black uppercase font-display text-black">{TRANSLATIONS[lang].dropTitle}</p>
                  <p className="text-xs text-black font-semibold opacity-70">{TRANSLATIONS[lang].dropSubtitle}</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 border-3 border-black bg-[#FFE600] text-black font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000000] transition-all cursor-pointer text-xs"
                >
                  {TRANSLATIONS[lang].selectBtn}
                </button>
              </div>
            ) : (
              <div className="space-y-6 w-full">
                <div className="border-3 border-black bg-[#86EFAC] p-4 shadow-[3px_3px_0px_0px_#000000] flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left">
                    <FileText className="w-8 h-8 stroke-[2.5]" />
                    <div>
                      <p className="font-extrabold text-sm text-black truncate max-w-xs sm:max-w-md">{selectedFile.name}</p>
                      <p className="text-[10px] font-mono font-bold opacity-70">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleClear}
                    className="p-1.5 border-2 border-black bg-[#FFA8E8] text-black hover:bg-rose-300 transition-colors shadow-[1px_1px_0px_0px_#000000]"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="bg-[#FFE600] border-3 border-black p-4 text-left shadow-[3px_3px_0px_0px_#000000] space-y-2">
                  <span className="font-black font-display text-xs uppercase block">{TRANSLATIONS[lang].statusTitle}</span>
                  <p className="text-xs font-semibold text-black leading-relaxed">
                    {lang === 'id' ? (
                      <>
                        Berkas <span className="font-mono bg-white px-1 border border-black">{selectedFile.name}</span> {TRANSLATIONS[lang].statusDesc}
                      </>
                    ) : (
                      <>
                        File <span className="font-mono bg-white px-1 border border-black">{selectedFile.name}</span> {TRANSLATIONS[lang].statusDesc}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Guide Panel */}
        <div className="md:col-span-4 space-y-6">
          <div className="border-3 border-black bg-[#FFA8E8] p-5 shadow-[4px_4px_0px_0px_#000000] space-y-4">
            <h3 className="font-black text-lg font-display uppercase tracking-tight text-black">{TRANSLATIONS[lang].guideTitle}</h3>
            <p className="text-xs font-semibold text-black leading-relaxed">
              {TRANSLATIONS[lang].guideDesc}
            </p>
            <div className="border-t border-black/20 pt-3 space-y-2 text-xs font-semibold text-black">
              <p className="flex items-start space-x-1.5">
                <span className="bg-black text-[#FFA8E8] w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">1</span>
                <span>{TRANSLATIONS[lang].guideStep1}</span>
              </p>
              <p className="flex items-start space-x-1.5">
                <span className="bg-black text-[#FFA8E8] w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">2</span>
                <span>{TRANSLATIONS[lang].guideStep2}</span>
              </p>
              <p className="flex items-start space-x-1.5">
                <span className="bg-black text-[#FFA8E8] w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">3</span>
                <span>{TRANSLATIONS[lang].guideStep3}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE: ABOUT US
// ============================================================================
function AboutPage({ lang, navigateTo }: { lang: 'id' | 'en'; navigateTo: (to: string) => void }) {
  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000000] space-y-6">
        <h1 className="text-4xl font-black uppercase font-display text-black tracking-tight border-b-4 border-black pb-4">
          {lang === 'id' ? 'Tentang SaveTheFile' : 'About SaveTheFile'}
        </h1>
        <p className="text-lg font-bold leading-relaxed text-black">
          {lang === 'id' 
            ? 'SaveTheFile berkomitmen penuh untuk menghadirkan peralatan pengolah berkas yang paling aman, cepat, dan privat bagi semua orang.' 
            : 'SaveTheFile is fully committed to delivering the most secure, fast, and private file processing tools for everyone.'}
        </p>
        <div className="space-y-4 text-black text-sm font-semibold leading-relaxed">
          <p>
            {lang === 'id'
              ? 'Kami menyadari bahwa data pribadi dan dokumen bisnis Anda sangatlah sensitif. Oleh karena itu, SaveTheFile dibangun dengan arsitektur 100% client-side. Seluruh aktivitas konversi dokumen, gambar, audio, spreadsheets, slides, e-books, arsip, vektor, CAD, hingga fonta diproses secara instan langsung di browser Anda menggunakan teknologi Web APIs, Canvas, AudioContext, dan Web Assembly lokal.'
              : 'We understand that your personal data and business documents are highly sensitive. Therefore, SaveTheFile is built with a 100% client-side architecture. All conversion tasks for documents, images, audio, spreadsheets, slides, e-books, archives, vectors, CAD, and fonts are processed instantly directly in your browser using local Web APIs, Canvas, AudioContext, and Web Assembly.'}
          </p>
          <p>
            {lang === 'id'
              ? 'File Anda tidak pernah meninggalkan perangkat Anda, tidak pernah disimpan di server mana pun, dan tidak ada pihak ketiga yang dapat mengintip informasi Anda. Ini adalah solusi pengolahan berkas modern yang mengutamakan privasi di atas segalanya.'
              : 'Your files never leave your device, are never stored on any server, and no third party can inspect your information. This is a modern file processing solution that puts privacy above all else.'}
          </p>
        </div>
        <div className="pt-4">
          <button 
            onClick={() => navigateTo('/')}
            className="px-6 py-3 border-3 border-black bg-[#FFE600] text-black font-black uppercase font-display tracking-wider shadow-[4px_4px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000000] transition-all cursor-pointer text-sm"
          >
            {lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE: PRIVACY POLICY
// ============================================================================
function PrivacyPage({ lang, navigateTo }: { lang: 'id' | 'en'; navigateTo: (to: string) => void }) {
  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-4 border-black bg-[#86EFAC] p-8 shadow-[8px_8px_0px_0px_#000000] space-y-6">
        <h1 className="text-4xl font-black uppercase font-display text-black tracking-tight border-b-4 border-black pb-4">
          {lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy'}
        </h1>
        <p className="text-lg font-bold leading-relaxed text-black">
          {lang === 'id'
            ? 'Privasi Anda adalah prioritas utama kami. Tidak ada pengumpulan data, tidak ada pelacakan, tidak ada server eksternal.'
            : 'Your privacy is our ultimate priority. No data collection, no tracking, no external servers.'}
        </p>
        <div className="space-y-4 text-black text-sm font-semibold leading-relaxed bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_#000000]">
          <h2 className="text-xl font-black font-display uppercase">{lang === 'id' ? '1. Pemrosesan Data Lokal' : '1. Local Data Processing'}</h2>
          <p>
            {lang === 'id'
              ? 'Semua file yang Anda unggah diproses langsung di memori browser perangkat Anda. Kami tidak memiliki server backend yang menerima atau menyimpan berkas Anda.'
              : 'All files you upload are processed directly within your device\'s browser memory. We do not operate any backend servers that receive or store your files.'}
          </p>
          <h2 className="text-xl font-black font-display uppercase">{lang === 'id' ? '2. Pengumpulan Informasi' : '2. Information Collection'}</h2>
          <p>
            {lang === 'id'
              ? 'SaveTheFile tidak menggunakan cookie pelacak pihak ketiga atau analitik invasif. Kami tidak melacak alamat IP Anda atau aktivitas konversi Anda.'
              : 'SaveTheFile does not utilize third-party tracking cookies or invasive analytics. We do not track your IP address or your conversion activities.'}
          </p>
          <h2 className="text-xl font-black font-display uppercase">{lang === 'id' ? '3. Hak Pengguna' : '3. User Rights'}</h2>
          <p>
            {lang === 'id'
              ? 'Karena data Anda tidak pernah disimpan oleh kami, Anda memegang kendali penuh 100% atas semua dokumen dan aset digital Anda setiap saat.'
              : 'Since your data is never stored by us, you retain 100% complete control over all your documents and digital assets at all times.'}
          </p>
        </div>
        <div className="pt-4">
          <button 
            onClick={() => navigateTo('/')}
            className="px-6 py-3 border-3 border-black bg-white text-black font-black uppercase font-display tracking-wider shadow-[4px_4px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000000] transition-all cursor-pointer text-sm"
          >
            {lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE: TERMS OF SERVICE
// ============================================================================
function TermsPage({ lang, navigateTo }: { lang: 'id' | 'en'; navigateTo: (to: string) => void }) {
  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-4 border-black bg-[#FFA8E8] p-8 shadow-[8px_8px_0px_0px_#000000] space-y-6">
        <h1 className="text-4xl font-black uppercase font-display text-black tracking-tight border-b-4 border-black pb-4">
          {lang === 'id' ? 'Syarat Ketentuan' : 'Terms of Service'}
        </h1>
        <p className="text-lg font-bold leading-relaxed text-black">
          {lang === 'id'
            ? 'Aturan penggunaan layanan SaveTheFile yang adil, terbuka, dan transparan.'
            : 'Rules of using SaveTheFile services that are fair, open, and transparent.'}
        </p>
        <div className="space-y-4 text-black text-sm font-semibold leading-relaxed bg-white p-5 border-3 border-black shadow-[4px_4px_0px_0px_#000000]">
          <h2 className="text-xl font-black font-display uppercase">{lang === 'id' ? '1. Lisensi Penggunaan' : '1. Use License'}</h2>
          <p>
            {lang === 'id'
              ? 'Layanan SaveTheFile disediakan secara gratis untuk penggunaan pribadi maupun komersial tanpa batas.'
              : 'SaveTheFile service is provided completely free of charge for both personal and commercial use without limitations.'}
          </p>
          <h2 className="text-xl font-black font-display uppercase">{lang === 'id' ? '2. Batasan Tanggung Jawab' : '2. Disclaimer of Warranties'}</h2>
          <p>
            {lang === 'id'
              ? 'Layanan ini disediakan "apa adanya" tanpa jaminan apa pun, baik tersurat maupun tersirat. Kami tidak bertanggung jawab atas kerugian atau kehilangan data akibat kegagalan konversi lokal.'
              : 'This service is provided "as is" without warranties of any kind, either expressed or implied. We are not liable for any losses or data loss caused by local conversion failures.'}
          </p>
          <h2 className="text-xl font-black font-display uppercase">{lang === 'id' ? '3. Modifikasi Layanan' : '3. Service Modification'}</h2>
          <p>
            {lang === 'id'
              ? 'Kami berhak memperbarui, memodifikasi, atau menambah jenis modul konversi secara berkala demi meningkatkan performa dan kenyamanan Anda.'
              : 'We reserve the right to update, modify, or add new converter modules periodically to improve performance and user experience.'}
          </p>
        </div>
        <div className="pt-4">
          <button 
            onClick={() => navigateTo('/')}
            className="px-6 py-3 border-3 border-black bg-white text-black font-black uppercase font-display tracking-wider shadow-[4px_4px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000000] transition-all cursor-pointer text-sm"
          >
            {lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE: CONTACT US
// ============================================================================
function ContactPage({ lang, navigateTo }: { lang: 'id' | 'en'; navigateTo: (to: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    }
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-4 border-black bg-[#A5F3FC] p-8 shadow-[8px_8px_0px_0px_#000000] space-y-6">
        <h1 className="text-4xl font-black uppercase font-display text-black tracking-tight border-b-4 border-black pb-4">
          {lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}
        </h1>
        <p className="text-lg font-bold leading-relaxed text-black">
          {lang === 'id'
            ? 'Ada masukan, pertanyaan, atau ingin berkontribusi? Jangan ragu untuk menghubungi tim NoverrusDev.'
            : 'Have feedback, questions, or want to contribute? Feel free to reach out to the NoverrusDev team.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Info */}
          <div className="space-y-6 text-black font-semibold text-sm">
            <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000000] space-y-3">
              <h3 className="font-extrabold text-lg uppercase font-display">{lang === 'id' ? 'Saluran Resmi' : 'Official Channels'}</h3>
              <p className="flex items-center space-x-2">
                <span className="font-black">Email:</span>
                <span className="font-mono bg-yellow-100 px-1.5 border border-black text-xs">support@noverrusdev.com</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-black">GitHub:</span>
                <span className="font-mono bg-emerald-100 px-1.5 border border-black text-xs">github.com/noverrusdev</span>
              </p>
            </div>
            
            <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000000] space-y-2">
              <h3 className="font-extrabold text-lg uppercase font-display">{lang === 'id' ? 'Lokasi Operasional' : 'Operation HQ'}</h3>
              <p>{lang === 'id' ? 'Dikelola sepenuhnya secara independen dan transparan dari Indonesia.' : 'Operated fully independently and transparently from Indonesia.'}</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border-3 border-black p-6 shadow-[5px_5px_0px_0px_#000000]">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full border-3 border-black bg-[#86EFAC] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000000]">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <p className="font-black uppercase font-display text-lg">{lang === 'id' ? 'Pesan Terkirim!' : 'Message Sent!'}</p>
                  <p className="text-xs font-bold text-gray-700">{lang === 'id' ? 'Terima kasih atas pesan Anda. Kami akan segera membalas.' : 'Thank you for your message. We will respond shortly.'}</p>
                </div>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 border-2 border-black bg-[#FFE600] font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000000]"
                >
                  {lang === 'id' ? 'Kirim Pesan Lain' : 'Send Another Message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">{lang === 'id' ? 'Nama Anda' : 'Your Name'}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-black p-2 text-xs font-semibold focus:bg-[#FFE600]/10 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">{lang === 'id' ? 'Alamat Email' : 'Email Address'}</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border-2 border-black p-2 text-xs font-semibold focus:bg-[#FFE600]/10 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">{lang === 'id' ? 'Pesan / Masukan' : 'Message / Feedback'}</label>
                  <textarea 
                    rows={3}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border-2 border-black p-2 text-xs font-semibold focus:bg-[#FFE600]/10 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-2.5 border-3 border-black bg-[#FFE600] text-black font-black uppercase font-display tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000000] transition-all cursor-pointer text-xs"
                >
                  {lang === 'id' ? 'Kirim Masukan' : 'Send Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={() => navigateTo('/')}
            className="px-6 py-3 border-3 border-black bg-white text-black font-black uppercase font-display tracking-wider shadow-[4px_4px_0px_0px_#000000] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#000000] transition-all cursor-pointer text-sm"
          >
            {lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODUL CONVERTER: INDIVIDUAL COMPONENT WRAPPERS
// ============================================================================

function DocumentsConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Documents Converter"
      desc={lang === 'id' ? "Ekstrak teks, buat dokumen, atau ubah format dokumen secara instan dan lokal." : "Extract text, create documents, or change document formats instantly and locally."}
      icon={FileText}
      colorClass="bg-[#FFE600]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".txt,.pdf,.docx,.html"
      lang={lang}
    />
  );
}

function ImagesConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Images Converter"
      desc={lang === 'id' ? "Kompres, ubah format, atau sesuaikan ukuran gambar Anda secara langsung." : "Compress, change format, or resize your images directly."}
      icon={ImageIcon}
      colorClass="bg-[#86EFAC]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes="image/*"
      lang={lang}
    />
  );
}

function VideoConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Video Converter"
      desc={lang === 'id' ? "Ekstrak bingkai video, potong durasi, atau periksa metadata berkas video." : "Extract video frames, cut duration, or inspect video file metadata."}
      icon={Video}
      colorClass="bg-[#FFA8E8]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes="video/*"
      lang={lang}
    />
  );
}

function AudioConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Audio Converter"
      desc={lang === 'id' ? "Rekam, potong, atau visualisasikan gelombang suara berkas audio Anda." : "Record, cut, or visualize the sound waves of your audio files."}
      icon={Music}
      colorClass="bg-[#A5F3FC]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes="audio/*"
      lang={lang}
    />
  );
}

function SpreadsheetsConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Spreadsheets Converter"
      desc={lang === 'id' ? "Ubah berkas CSV menjadi JSON atau sebaliknya, dan edit tabel secara lokal." : "Convert CSV files to JSON or vice-versa, and edit tables locally."}
      icon={Table}
      colorClass="bg-[#FFD0A3]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".csv,.json,.xlsx"
      lang={lang}
    />
  );
}

function EbooksConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="E-books Converter"
      desc={lang === 'id' ? "Format ulang tulisan e-book, hitung statistik, atau baca dalam mode Serif." : "Reformat e-book texts, calculate statistics, or read in Serif mode."}
      icon={BookOpen}
      colorClass="bg-[#FFA8E8]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".epub,.txt,.pdf"
      lang={lang}
    />
  );
}

function SlidesConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Slides Converter"
      desc={lang === 'id' ? "Ubah naskah Markdown menjadi tayangan presentasi interaktif siap pakai." : "Turn Markdown scripts into ready-to-use interactive presentations."}
      icon={Presentation}
      colorClass="bg-[#FFE600]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".md,.txt"
      lang={lang}
    />
  );
}

function ArchivesConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Archives Converter"
      desc={lang === 'id' ? "Buat bundel arsip virtual (.zip) atau ekstrak berkas lokal secara langsung." : "Create virtual archive bundles (.zip) or extract local files directly."}
      icon={Archive}
      colorClass="bg-[#86EFAC]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".zip,.tar,.gz"
      lang={lang}
    />
  );
}

function VectorConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Vector Converter"
      desc={lang === 'id' ? "Render SVG menjadi gambar PNG atau sesuaikan properti visual grafis vektor." : "Render SVG to PNG images or adjust vector graphic visual properties."}
      icon={PenTool}
      colorClass="bg-[#A5F3FC]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".svg"
      lang={lang}
    />
  );
}

function CadConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="CAD Converter"
      desc={lang === 'id' ? "Gambar sketsa vektor CAD interaktif dan ekspor menjadi DXF/SVG." : "Draw interactive CAD vector sketches and export them as DXF/SVG."}
      icon={PenTool}
      colorClass="bg-[#FFD0A3]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".dxf,.svg,.json"
      lang={lang}
    />
  );
}

function FontsConverter({ lang }: { lang: 'id' | 'en' }) {
  return (
    <BaseConverterPlaceholder 
      title="Fonts Converter"
      desc={lang === 'id' ? "Uji ketikan berkas fonta (TTF, OTF, WOFF) lokal Anda secara langsung." : "Directly test typing local font files (TTF, OTF, WOFF) on your device."}
      icon={Type}
      colorClass="bg-[#FFE600]"
      badgeText={lang === 'id' ? "0% CODE - SIAP DIBENTUK" : "0% CODE - READY TO SHAPE"}
      acceptedFileTypes=".ttf,.otf,.woff,.woff2"
      lang={lang}
    />
  );
}
