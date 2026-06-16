"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import {
  Upload,
  Camera,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  ArrowLeft,
  X
} from "lucide-react";

export default function UploadPrescriptionPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Camera capture states
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      setError("Please select an image file (PNG, JPG) or a PDF report.");
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Start Camera Capture
  const startCamera = async () => {
    setError(null);
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Camera access was denied or is not supported. Use file upload instead.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "camera_prescription.jpg", {
              type: "image/jpeg"
            });
            handleFileChange(capturedFile);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    // Simulate steps
    try {
      setStatusStep("Initiating scanner...");
      await new Promise(r => setTimeout(r, 600));
      
      setStatusStep("Extracting handwritten clinical text (OCR)...");
      await new Promise(r => setTimeout(r, 800));

      setStatusStep("Checking medication databases & food interactions...");
      await new Promise(r => setTimeout(r, 800));

      setStatusStep("Calculating prescription clarity score...");
      
      const formData = new FormData();
      formData.append("file", file);
      
      const result = await api.uploadPrescription(formData);
      router.push(`/prescription-analysis/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze prescription. Make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-6 overflow-y-auto flex flex-col justify-center">
        {/* Back navigation */}
        <div className="w-full max-w-2xl mx-auto mb-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="w-full max-w-2xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-slate-900 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-100">Smart Prescription Scan</h2>
            <p className="text-sm text-slate-400 mt-2">
              Upload an image of your prescription to translate abbreviations, check drug allergies, and score clarity.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loader */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
                <Zap className="h-6 w-6 text-teal-400 absolute animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-teal-400">Processing Clinical File</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 animate-pulse">{statusStep}</p>
              </div>
            </div>
          ) : showCamera ? (
            /* Live Camera Capture Panel */
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button
                  onClick={stopCamera}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-2.5 bg-teal-500 text-slate-950 text-sm font-extrabold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Capture Image
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-2.5 bg-slate-950 border border-slate-800 text-sm font-bold text-slate-400 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* File Upload / Camera Trigger Panel */
            <div className="space-y-6">
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 p-12 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer group transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                
                {preview ? (
                  <div className="space-y-4">
                    {file?.type === "application/pdf" ? (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-teal-400" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-200">{file.name}</p>
                          <p className="text-xs text-slate-500 font-bold">{(file.size / 1024).toFixed(1)} KB (PDF document)</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-xl border border-slate-800 shadow-lg object-contain"
                      />
                    )}
                    <p className="text-xs text-slate-500 font-bold">Click to replace files</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-500 border border-slate-800 group-hover:text-teal-400 group-hover:border-teal-500/20 transition-all mb-4">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-300">Drag & drop your file here, or click to browse</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Supports PDF, PNG, JPEG</p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-all"
                >
                  <Camera className="h-5 w-5 text-slate-500" />
                  Capture with Camera
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!file}
                  className="flex items-center justify-center gap-2 flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Sparkles className="h-5 w-5" />
                  Analyze Document
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
