"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Upload, Loader2, CheckCircle, Download } from "lucide-react";

export default function SupabaseImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "pending" | "processing" | "completed" | "error">("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState("webp");

  // Realtime Database Subscription
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`job_${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversions",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updated = payload.new;
          setStatus(updated.status);
          if (updated.status === "completed") {
            setResultUrl(updated.converted_url);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Bypasses Next.js API limits by directly sending the Blob up to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("files").getPublicUrl(filePath);

      // Create a Database Job Row (Triggers the Node.js Webhook remotely)
      const { data: insertData, error: dbError } = await supabase
        .from("conversions")
        .insert({
          original_url: publicData.publicUrl,
          target_format: targetFormat,
          status: "pending",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setJobId(insertData.id);
      setStatus("pending");
    } catch (err) {
      console.error("Upload workflow failed:", err);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Cloud Image Converter</h1>
        <p className="text-slate-500 mt-2">Enterprise-grade server-side processing via Supabase & Async Workers.</p>
      </div>

      {/* Direct-to-Storage Dropzone */}
      <div
        className="w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 bg-white hover:bg-indigo-50/10 cursor-pointer transition-colors"
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) setFile(e.target.files[0]);
          }}
        />
        <Upload className="h-10 w-10 text-slate-400 mb-4" />
        <p className="font-medium text-slate-700">{file ? file.name : "Drag & Drop or click to upload"}</p>
        {!file && <p className="text-sm text-slate-500 mt-1">Direct upload to Storage bucket limits (1GB+)</p>}
      </div>

      {file && status === "idle" && (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border">
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value)}
            className="border rounded-md px-3 py-2 bg-slate-50 w-full sm:w-auto flex-1"
          >
            <option value="webp">to WEBP</option>
            <option value="png">to PNG</option>
            <option value="jpg">to JPG</option>
          </select>
          <button
            onClick={handleUpload}
            className="px-8 py-2.5 w-full sm:w-auto bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
          >
            Upload & Convert
          </button>
        </div>
      )}

      {/* Realtime Progress Tracking */}
      {status !== "idle" && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 {status === "completed" ? (
                   <CheckCircle className="w-8 h-8 text-emerald-500" />
                 ) : status === "error" ? (
                   <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold">!</div>
                 ) : (
                   <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                 )}
                 <div>
                    <p className="font-semibold text-slate-800 capitalize text-lg">{status}</p>
                    <p className="text-sm text-slate-500">
                       {status === "uploading" && "Directing stream strictly to Supabase Storage..."}
                       {status === "pending" && "Streaming webhook dispatch to Worker..."}
                       {status === "processing" && "Headless server node is converting the visual data..."}
                       {status === "completed" && "Successfully rendered and cached!"}
                    </p>
                 </div>
              </div>
           </div>

           {status === "completed" && resultUrl && (
             <a
               href={resultUrl}
               download
               className="inline-flex items-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
             >
               <Download className="w-5 h-5 mr-2" />
               Download Result File
             </a>
           )}
        </div>
      )}
    </div>
  );
}
