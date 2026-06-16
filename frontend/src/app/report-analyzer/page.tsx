"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import VoiceAssistant from "@/components/VoiceAssistant";
import { api } from "@/lib/api";
import {
  Activity,
  Upload,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  CheckCircle,
  Info
} from "lucide-react";

export default function ReportAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusStep, setStatusStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [reportResult, setReportResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const logs = await api.getReports();
      setHistory(logs);
      if (logs.length > 0 && !reportResult) {
        // Default to showing the latest parsed report in details
        setReportResult(logs[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
        setError("Invalid file type. Only PDF and image uploads are supported.");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      setStatusStep("Connecting to clinical parser...");
      await new Promise(r => setTimeout(r, 600));
      setStatusStep("Analyzing laboratory cells and chemical parameters...");
      await new Promise(r => setTimeout(r, 800));
      setStatusStep("Evaluating reference boundaries and flags...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.uploadReport(formData);
      setReportResult(res);
      setFile(null);
      // Reload history list
      await fetchHistory();
    } catch (err: any) {
      setError(err.message || "Failed to analyze the health report.");
    } finally {
      setLoading(false);
    }
  };

  const activeStructured = reportResult?.structured_data || {};
  const extractedValues = activeStructured.extracted_values || [];
  const statusFlag = reportResult?.health_status || activeStructured.health_status || "🟢 Within expected range";
  const explanation = activeStructured.simple_explanation || "No interpretation provided.";
  const suggestions = activeStructured.preventive_care_suggestions || [];
  const trend = activeStructured.trend_recommendation || "";

  // TTS text compilation
  const speechText = `
    Medical Report Analysis.
    Report Type: ${reportResult?.report_type}.
    Overall Health Status: ${statusFlag}.
    Extracted parameters: ${extractedValues.map((v: any) => `${v.parameter} is ${v.value} ${v.unit}, status is ${v.status}.`).join(" ")}
    Interpretation: ${explanation}
    Preventive guidelines: ${suggestions.join(" ")}
  `;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">
            Health Report Analyzer
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Translate blood tests, lipid panels, glucose, and thyroid sheets into plain terms.
          </p>
        </div>

        {/* Upload Card + History list Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* UPLOAD FORM (Left 4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Upload New Lab Report</h3>
              
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-cyan-500/15 border-t-cyan-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-cyan-400 font-bold animate-pulse">{statusStep}</p>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="border border-slate-800 bg-slate-950/60 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-slate-500 mb-2" />
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                      id="report-upload-file"
                    />
                    <label htmlFor="report-upload-file" className="cursor-pointer text-xs font-bold text-cyan-400 hover:text-cyan-300">
                      {file ? file.name : "Select lab sheet (PDF/Image)"}
                    </label>
                    {file && <p className="text-[10px] text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={!file}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-black rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Interpret Lab Report
                  </button>
                </form>
              )}
            </div>

            {/* History Logs */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Parsed Reports</h3>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No reports interpreted yet.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[300px]">
                  {history.map((h, i) => (
                    <button
                      key={h.id}
                      onClick={() => setReportResult(h)}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                        reportResult?.id === h.id
                          ? "bg-slate-900 border-cyan-500/30 text-cyan-400"
                          : "bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-extrabold truncate">{h.filename}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{new Date(h.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-extrabold">
                        {h.report_type.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ANALYSIS RESULTS DISPLAY (Right 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {!reportResult ? (
              <div className="h-64 flex flex-col justify-center items-center text-center border border-dashed border-slate-800 rounded-3xl text-slate-500">
                <Info className="h-10 w-10 mb-2" />
                <p className="text-sm font-semibold">No active analysis details shown.</p>
                <p className="text-xs mt-1">Upload a lab sheet to extract values.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Voice accessibility */}
                <VoiceAssistant textToRead={speechText} title="Lab Results Voice Reader" />

                {/* Main Card */}
                <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 shadow-xl">
                  {/* Status Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Analyzed Panel</span>
                      <h3 className="text-lg font-black text-slate-200">{reportResult.report_type}</h3>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-right">Health Status</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border mt-1 ${
                        statusFlag.includes("Expected") || statusFlag.includes("🟢")
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                          : statusFlag.includes("Attention") || statusFlag.includes("🟡")
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {statusFlag}
                      </span>
                    </div>
                  </div>

                  {/* Parameter Extraction Table */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Test Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold">
                            <th className="pb-2 px-4">Test Name</th>
                            <th className="pb-2 px-4">Result Value</th>
                            <th className="pb-2 px-4">Normal Range</th>
                            <th className="pb-2 px-4">Flags</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {extractedValues.map((val: any, idx: number) => {
                            const isHighOrLow = 
                              val.status.toLowerCase().includes("high") || 
                              val.status.toLowerCase().includes("low") || 
                              val.status.includes("🔴") || 
                              val.status.toLowerCase().includes("diabetic") ||
                              val.status.toLowerCase().includes("prediabetic");
                            return (
                              <tr 
                                key={idx} 
                                className={`transition-colors duration-150 ${
                                  isHighOrLow 
                                    ? "bg-red-500/5 hover:bg-red-500/10" 
                                    : "hover:bg-slate-900/10"
                                }`}
                              >
                                <td className="py-3 px-4 font-extrabold text-slate-200">{val.parameter}</td>
                                <td className="py-3 px-4 font-semibold text-slate-300">
                                  {val.value} <span className="text-[10px] text-slate-500 font-bold">{val.unit}</span>
                                </td>
                                <td className="py-3 px-4 text-slate-500">{val.reference_range}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                    isHighOrLow ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  }`}>
                                    {val.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Doctor Consultation Recommendation Alert */}
                  {(extractedValues.some((v: any) => 
                    v.status.toLowerCase().includes("high") || 
                    v.status.toLowerCase().includes("low") || 
                    v.status.includes("🔴") || 
                    v.status.toLowerCase().includes("diabetic")
                  ) || statusFlag.includes("🔴") || statusFlag.includes("Follow-up")) && (
                    <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-300 space-y-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                          <AlertCircle className="h-6 w-6 shrink-0" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">Critical Health Advisory</h4>
                          <p className="text-xs font-black text-white/95">Suggestion: Meet the doctor</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        One or more parameters in your health report are outside the normal clinical reference range. 
                        We strongly advise scheduling an appointment with your primary care physician or a specialist to review these results. Do not self-medicate or alter current dosages without medical supervision.
                      </p>
                      <div className="pt-3 border-t border-red-500/20 flex flex-wrap gap-2 text-xs font-black text-red-400">
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
                          💡 Suggestion: Meet the doctor
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800">
                          📋 Share this report analysis with them
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Simple Explanation */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed">
                    <h4 className="font-bold text-cyan-400 flex items-center gap-1">
                      <Info className="h-4 w-4 shrink-0" />
                      Patient-Friendly Interpretation
                    </h4>
                    <p className="text-slate-300">{explanation}</p>
                  </div>

                  {/* Trend Recommendations */}
                  {trend && (
                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-2 text-xs leading-relaxed">
                      <h4 className="font-bold text-cyan-400 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 shrink-0" />
                        Trend Insights & Longitudinal Recommendations
                      </h4>
                      <p className="text-slate-300">{trend}</p>
                    </div>
                  )}

                  {/* Preventive Care Suggestions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifestyle Suggestions</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestions.map((sug: string, idx: number) => (
                        <li key={idx} className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disclaimer banner */}
                  <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                    ⚠️ Safety Notice: HealthQ laboratory parsing utilizes vision intelligence models to translate clinical metrics. Check values with your lab provider before implementing medication adjustments or major lifestyle modifications.
                  </p>

                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
