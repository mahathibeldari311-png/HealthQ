"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import VoiceAssistant from "@/components/VoiceAssistant";
import { api } from "@/lib/api";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Camera,
  Upload,
  Clock,
  HelpCircle,
  Info,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export default function ExpiryCheckerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Camera integration state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchHistory = async () => {
    try {
      const logs = await api.getExpiryLogs();
      setHistory(logs);
    } catch (err) {
      console.error("Failed to load expiry checker history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setIsCameraActive(false);
    }
  };

  const handleStartCamera = async () => {
    setError(null);
    setIsCameraActive(true);
    setPreviewUrl(null);
    setFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please upload an image file instead.");
      setIsCameraActive(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "captured_tablet.jpg", {
              type: "image/jpeg"
            });
            setFile(capturedFile);
            setPreviewUrl(URL.createObjectURL(capturedFile));
            
            // Stop video stream
            const stream = video.srcObject as MediaStream;
            if (stream) {
              stream.getTracks().forEach((track) => track.stop());
            }
            setIsCameraActive(false);
          }
        }, "image/jpeg");
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError("Please select or capture a tablet date stamp image first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.scanTabletExpiry(formData);
      setResult(res);
      await fetchHistory();
    } catch (err: any) {
      setError(err.message || "Failed to analyze tablet image.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    try {
      await api.deleteExpiryLog(id);
      await fetchHistory();
      if (result && result.id === id) {
        setResult(null);
      }
    } catch (err) {
      console.error("Failed to delete log:", err);
    }
  };

  const isNearExpiry = result && !result.is_expired && result.days_remaining !== null && result.days_remaining >= 1 && result.days_remaining <= 7;

  // Build text to be read by the TTS VoiceAssistant
  const speechText = result
    ? `Tablet Expiry Scan.
       Manufacturing Date: ${result.mfg_date || "Not detected"}.
       Expiry Date: ${result.exp_date || "Not detected"}.
       Status: ${result.is_expired ? "Expired" : isNearExpiry ? "Near Expiry" : "Valid"}.
       Recommendation: ${result.recommendation_text}.`
    : "";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Page Header */}
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-teal-400" />
            Tablet Expiry Checker
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Scan the date stamp on a medicine strip or blister pack to check if it has expired.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Upload & Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Upload Medicine Strip</h3>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Upload Input Area */}
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />

                {isCameraActive ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleCapturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-teal-500 hover:bg-teal-450 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                    >
                      <Camera className="h-4 w-4" />
                      Capture Frame
                    </button>
                  </div>
                ) : previewUrl ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-850 bg-slate-950 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Tablet Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-bold"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-6 group"
                  >
                    <Upload className="h-8 w-8 text-slate-600 group-hover:text-slate-500 mb-3" />
                    <span className="text-xs text-slate-400 font-bold">Select image from files</span>
                    <span className="text-[10px] text-slate-600 font-semibold mt-1">PNG, JPG, WEBP formats supported</span>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-slate-500" />
                    File Upload
                  </button>
                  <button
                    onClick={handleStartCamera}
                    className="flex-1 py-2.5 bg-slate-950 border border-slate-855 hover:border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-slate-500" />
                    Use Camera
                  </button>
                </div>
              </div>

              <button
                onClick={handleUploadSubmit}
                disabled={!file || loading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 text-xs font-black rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {loading ? "Analyzing Expiry Stamp..." : "Verify Expiry Date"}
              </button>
            </div>

            {/* Helper presets for offline or testing convenience */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Guidance Note</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                To get the best results, make sure the camera captures the text section showing the Manufacturing Date (MFG) and Expiry Date (EXP) clearly under bright lighting.
              </p>
            </div>
          </div>

          {/* Right Side: Results & History */}
          <div className="lg:col-span-7 space-y-6">
            {!result ? (
              <div className="h-64 flex flex-col justify-center items-center text-center border border-dashed border-slate-850 rounded-3xl text-slate-500 bg-slate-900/10">
                <HelpCircle className="h-10 w-10 mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No active analysis loaded.</p>
                <p className="text-xs mt-1">Upload a tablet image on the left to verify.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Voice TTS player */}
                <VoiceAssistant textToRead={speechText} title="Expiry Verification Reader" />

                {/* Expiry Verification Card */}
                <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 shadow-xl">
                  
                  {/* Result Header Banner */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expiry Verification Status</span>
                      <h4 className={`text-lg font-black mt-0.5 ${
                        result.is_expired 
                          ? "text-red-400 animate-pulse" 
                          : isNearExpiry 
                            ? "text-amber-400 animate-pulse" 
                            : "text-teal-400"
                      }`}>
                        {result.is_expired ? "EXPIRED" : isNearExpiry ? "NEAR EXPIRY (WARNING)" : "SAFE / VALID"}
                      </h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      {result.is_expired ? (
                        <ShieldAlert className="h-6 w-6 text-red-500" />
                      ) : isNearExpiry ? (
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                      ) : (
                        <ShieldCheck className="h-6 w-6 text-teal-400" />
                      )}
                    </div>
                  </div>

                  {/* Dynamic Alert Banner */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    result.is_expired 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : isNearExpiry
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                  }`}>
                    {result.is_expired ? (
                      <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                    ) : isNearExpiry ? (
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-teal-400" />
                    )}
                    <div className="space-y-1">
                      <span className="font-bold uppercase text-xs tracking-wider block">System Advisory</span>
                      <p className="text-xs font-semibold leading-relaxed">{result.recommendation_text}</p>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Mfg. Date</span>
                      <span className="text-sm font-black text-slate-300 mt-1 block">{result.mfg_date || "Not Found"}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Exp. Date</span>
                      <span className="text-sm font-black text-slate-300 mt-1 block">{result.exp_date || "Not Found"}</span>
                    </div>
                  </div>

                  {!result.is_expired && result.days_remaining !== null && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                        <Clock className={`h-4 w-4 ${isNearExpiry ? "text-amber-400 animate-pulse" : "text-indigo-400"}`} />
                        <span>Days remaining until expiration:</span>
                      </div>
                      <span className={`font-black px-2.5 py-0.5 rounded-lg ${
                        isNearExpiry 
                          ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" 
                          : "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                      }`}>
                        {result.days_remaining} Days
                      </span>
                    </div>
                  )}

                  {/* Medical Disclaimer */}
                  <div className="pt-4 border-t border-slate-900 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
                    <Info className="h-4.5 w-4.5 text-slate-600 shrink-0 mt-0.5" />
                    <p>
                      Disclaimer: This tool detects dates via text scanning and computes safety based on local system clocks. Always check the physical date print on the container to double check the expiration status.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* History logs section */}
            {history.length > 0 && (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900 p-6 rounded-3xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Expiry Scan Session Logs</h3>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {history.map((h) => (
                    <div key={h.id} className="p-4 bg-slate-950 border border-slate-900/60 rounded-2xl flex justify-between items-center gap-4 text-xs hover:bg-slate-900/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-300 truncate">{h.filename}</p>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                          <span>MFG: {h.mfg_date || "N/A"}</span>
                          <span>•</span>
                          <span>EXP: {h.exp_date || "N/A"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                          h.is_expired 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                            : (h.days_remaining !== null && h.days_remaining >= 1 && h.days_remaining <= 7)
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        }`}>
                          {h.is_expired ? "Expired" : (h.days_remaining !== null && h.days_remaining >= 1 && h.days_remaining <= 7) ? "Near Expiry" : "Valid"}
                        </span>
                        <button
                          onClick={() => handleDeleteLog(h.id)}
                          className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
                          title="Delete Scan Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
