import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useAutoDelete, formatTimeLeft } from "@/hooks/useAutoDelete";
import { Upload, FileVideo, Download, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Using UNPKG to fetch web assembly core dynamically so we don't need heavy setups
const BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

export function MediaConverter() {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);
  
  const ffmpegRef = useRef(new FFmpeg());
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>("mp4");
  
  // Conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Output state
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  // Auto-delete hook handles memory cleanup
  const timeLeftMs = useAutoDelete(outputUrl, () => {
    setOutputUrl(null);
    setSelectedFile(null);
  }, 3600000); // 1 hour

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    setErrorMSG(null);
    try {
      const ffmpeg = ffmpegRef.current;
      
      // Load event listeners
      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      
      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });

      // Load WASM from static standard single-thread core to avoid need for COOP/COEP headers
      // Note: If you have configured Cross-Origin-Opener-Policy, you could use @ffmpeg/core-mt
      await ffmpeg.load({
        coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setLoaded(true);
    } catch (error: any) {
      console.error(error);
      setErrorMSG("Failed to load FFmpeg kernel. Make sure your network allows script loading from unpkg.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConvert = async () => {
    if (!selectedFile) return;
    if (!loaded) await load();
    if (!loaded) return;

    setIsConverting(true);
    setProgress(0);
    setErrorMSG(null);
    
    try {
      const ffmpeg = ffmpegRef.current;
      const inputFileName = selectedFile.name;
      const outputFileName = `converted_${Date.now()}.${targetFormat}`;

      // 1. Write the file to FFmpeg's virtual FS
      await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

      // 2. Run conversion (basic flags, optimized for compatibility)
      // Example: convert to target
      await ffmpeg.exec(["-i", inputFileName, outputFileName]);

      // 3. Read back the file
      const data = await ffmpeg.readFile(outputFileName);
      
      // 4. Determine MIME
      let mime = `video/${targetFormat}`;
      if (targetFormat === "mp3" || targetFormat === "wav") {
        mime = `audio/${targetFormat}`;
      }

      // 5. Create Blob and Object URL
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);

      // Clean up FS
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      
    } catch (e: any) {
      console.error(e);
      setErrorMSG("An error occurred during conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setOutputUrl(null); // Reset
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Media Converter</h2>
          <p className="text-slate-500 mt-1">Convert videos offline using WebAssembly</p>
        </div>
      </div>

      {errorMSG && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <p className="text-sm">{errorMSG}</p>
        </div>
      )}

      {/* Upload Zone */}
      <div 
        className={cn(
          "w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors px-4 text-center cursor-pointer",
          selectedFile ? "border-indigo-300 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="video/*,audio/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSelectedFile(e.target.files[0]);
              setOutputUrl(null);
            }
          }}
        />
        {selectedFile ? (
          <>
            <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <FileVideo className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="font-semibold text-slate-800 break-all max-w-[80%]">{selectedFile.name}</p>
            <p className="text-sm text-slate-500 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="text-xs text-indigo-500 mt-4 font-medium">Click or drag a different file to replace</p>
          </>
        ) : (
          <>
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-slate-500" />
            </div>
            <p className="font-semibold text-slate-800">Drag & Drop your media file here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse local files</p>
          </>
        )}
      </div>

      {/* Controls */}
      {selectedFile && !outputUrl && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Format</label>
              <select 
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                disabled={isConverting}
                className="block w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px]"
              >
                <optgroup label="Video">
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="avi">AVI</option>
                </optgroup>
                <optgroup label="Audio Extraction">
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </optgroup>
              </select>
            </div>
            <div className="w-full sm:w-auto pt-6 sm:pt-0 shrink-0">
               <button
                  onClick={handleConvert}
                  disabled={isConverting || loading || !loaded}
                  className="w-full sm:w-auto px-6 py-2.5 mt-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
               >
                 {isConverting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Converting {progress}%
                    </>
                 ) : loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading Engine...
                    </>
                 ) : (
                    <>
                      <RefreshCcw className="w-5 h-5 mr-2" />
                      Start Conversion
                    </>
                 )}
               </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          {isConverting && (
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Output / Success */}
      {outputUrl && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
              <Download className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Conversion Successful</h3>
            <p className="text-emerald-700 text-sm max-w-md">
              Your file is ready to download. For absolute privacy and device memory protection, this link runs entirely locally.
            </p>
            
            <a 
              href={outputUrl} 
              download={`converted_${selectedFile?.name.split('.')[0]}.${targetFormat}`}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              <Download className="w-5 h-5 mr-2" />
              Download {targetFormat.toUpperCase()}
            </a>

            <div className="pt-4 flex items-center justify-center text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full mt-4">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Auto-Memory Deletion in: {formatTimeLeft(timeLeftMs)}
            </div>
        </div>
      )}
    </div>
  );
}
