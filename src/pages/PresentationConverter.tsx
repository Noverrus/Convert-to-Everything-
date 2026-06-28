import React, { useState, useEffect } from "react";
import { Upload, Presentation, Download, Loader2, AlertCircle, Trash2, ShieldCheck, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  themeColor: string;
}

export function PresentationConverter() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: crypto.randomUUID(),
      title: "Introduction",
      subtitle: "My Offline Deck",
      body: "Built completely in the browser using high-performance flat local scripts. Secure, private, lightning fast.",
      themeColor: "#4f46e5"
    }
  ]);
  const [toastError, setToastError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      title: "New Slide Title",
      subtitle: "Section Header",
      body: "Describe your ideas and notes perfectly inside this slide text box.",
      themeColor: "#4f46e5"
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIdx(slides.length);
  };

  const handleUpdateSlide = (field: keyof Slide, value: string) => {
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, [field]: value } : s));
  };

  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 1) {
      setToastError("At least one slide is required to create a presentation.");
      setTimeout(() => setToastError(null), 5000);
      return;
    }
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setActiveSlideIdx(0);
  };

  const handleCompilePDF = async () => {
    setIsCompiling(true);
    try {
      // Landscape Presentation PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [1920, 1080]
      });

      slides.forEach((slide, idx) => {
        if (idx > 0) pdf.addPage();

        // Background
        pdf.setFillColor("#0f172a"); // Dark slate premium background
        pdf.rect(0, 0, 1920, 1080, "F");

        // Colorful side strip
        pdf.setFillColor(slide.themeColor);
        pdf.rect(0, 0, 40, 1080, "F");

        // Typography settings
        pdf.setTextColor("#ffffff");
        
        // Slide Index
        pdf.setFontSize(28);
        pdf.text(`${idx + 1} / ${slides.length}`, 1800, 1000);

        // Subtitle / Header info
        pdf.setFontSize(32);
        pdf.setTextColor(slide.themeColor);
        pdf.text(slide.subtitle.toUpperCase(), 150, 200);

        // Title
        pdf.setFontSize(72);
        pdf.setTextColor("#ffffff");
        pdf.text(slide.title, 150, 320);

        // Body Text
        pdf.setFontSize(40);
        pdf.setTextColor("#cbd5e1");
        const splitBody = pdf.splitTextToSize(slide.body, 1500);
        pdf.text(splitBody, 150, 480);
      });

      pdf.save(`presentation_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      setToastError("Failed to compile presentation slide-deck.");
    } finally {
      setIsCompiling(false);
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
        <h2 className="text-3xl font-bold text-slate-800 font-sans">Presentation Slide Builder</h2>
        <p className="text-slate-500 mt-1">
          Draft and compile professional widescreen 1080p PDF presentation slides directly in local sandbox memory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-700">Presentation Deck</span>
            <button 
              onClick={handleAddSlide}
              className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Slide
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm divide-y max-h-[400px] overflow-y-auto">
            {slides.map((slide, idx) => (
              <div 
                key={slide.id} 
                onClick={() => setActiveSlideIdx(idx)}
                className={cn(
                  "p-4 flex items-center justify-between cursor-pointer transition-colors text-sm",
                  idx === activeSlideIdx ? "bg-indigo-50" : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-3 shrink-0" 
                    style={{ backgroundColor: slide.themeColor }}
                  />
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">Slide {idx + 1}: {slide.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{slide.subtitle || "No category subtitle"}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSlide(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 rounded ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={handleCompilePDF}
            disabled={isCompiling}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center text-sm"
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Compile Slide-Deck PDF
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          <div className="border rounded-2xl aspect-[1.77] w-full p-8 flex flex-col justify-between text-white relative overflow-hidden bg-slate-900 shadow-inner">
            <div 
              className="absolute left-0 top-0 bottom-0 w-2.5" 
              style={{ backgroundColor: slides[activeSlideIdx]?.themeColor }}
            />
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: slides[activeSlideIdx]?.themeColor }}>
                {slides[activeSlideIdx]?.subtitle || "SUBTITLE PLACEHOLDER"}
              </p>
              <h3 className="text-3xl font-extrabold mt-3 tracking-tight">
                {slides[activeSlideIdx]?.title || "Slide Title"}
              </h3>
              <p className="text-sm mt-6 text-slate-300 leading-relaxed max-w-[90%]">
                {slides[activeSlideIdx]?.body || "Active slide body content details..."}
              </p>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>WASM PRESENTATION GENERATOR</span>
              <span>SLIDE {activeSlideIdx + 1} / {slides.length}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Slide Title</label>
                <input 
                  type="text" 
                  value={slides[activeSlideIdx]?.title || ""}
                  onChange={(e) => handleUpdateSlide("title", e.target.value)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Slide Subtitle</label>
                <input 
                  type="text" 
                  value={slides[activeSlideIdx]?.subtitle || ""}
                  onChange={(e) => handleUpdateSlide("subtitle", e.target.value)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Slide Body Content</label>
              <textarea 
                rows={3}
                value={slides[activeSlideIdx]?.body || ""}
                onChange={(e) => handleUpdateSlide("body", e.target.value)}
                className="w-full mt-1 border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase">Theme Accent Color</label>
              <div className="flex items-center gap-2 mt-1.5">
                {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"].map(color => (
                  <button 
                    key={color} 
                    onClick={() => handleUpdateSlide("themeColor", color)}
                    className={cn(
                      "w-6 h-6 rounded-full border border-white shadow-sm hover:scale-110 transition-transform",
                      slides[activeSlideIdx]?.themeColor === color ? "ring-2 ring-indigo-500" : ""
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
