"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import VoiceAssistant from "@/components/VoiceAssistant";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  ArrowLeft,
  FileCheck,
  AlertTriangle,
  Pill,
  Activity,
  Heart,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";

export default function PrescriptionAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMed, setExpandedMed] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (params.id) {
          const detail = await api.getPrescription(params.id as string);
          setData(detail);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load prescription detail.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 lg:pl-72 p-6 md:p-8 flex items-center justify-center text-slate-500 gap-2">
          <Clock className="h-6 w-6 animate-spin text-teal-400" />
          <span>Loading prescription metadata...</span>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 lg:pl-72 p-6 md:p-8 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-xl font-bold text-slate-200">Analysis Fetch Failed</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center">{error || "Prescription record not found."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-300"
          >
            Go to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const structured = data.structured_data || {};
  const medicines = structured.medicines || [];
  const diagnosis = structured.diagnosis || "No condition summary available.";
  const clarityScore = structured.clarity_score || data.clarity_score || 100;
  const clarityReasons = structured.clarity_reasons || ["OCR compiled successfully"];
  const missingInfo = structured.missing_information || [];
  const allergyAlerts = structured.allergy_alerts || [];
  const diseaseMedMatching = structured.disease_medicine_matching || [];
  const foodRecommendations = structured.food_recommendations || { eat: [], avoid: [], timing: "" };
  const preventiveCare = structured.preventive_care || { lifestyle: [], sleep: "", hydration: "", warning_signs: "" };

  // Prepare full summary speech string
  const speechText = `
    Prescription Analysis Summary.
    Diagnosis: ${diagnosis}.
    This prescription has a clarity score of ${clarityScore} out of 100.
    Medicines prescribed: ${medicines.map((m: any) => `${m.name}, dosage ${m.dosage}, taking ${m.frequency}.`).join(" ")}
    Allergy Alerts: ${allergyAlerts.length > 0 ? allergyAlerts.map((a: any) => a.warning_text).join(" ") : "No drug family allergy alerts found."}
    Food guidance: Foods to eat include ${foodRecommendations.eat.join(", ")}. Foods to avoid: ${foodRecommendations.avoid.join(", ")}.
    Lifestyle recommendations: ${preventiveCare.lifestyle.join(" ")}.
  `;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <button
              onClick={() => router.push("/history")}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-slate-100 truncate max-w-xl">
              Analysis: {data.filename}
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              Uploaded on {new Date(data.created_at).toLocaleString()} | OCR Confidence: {data.ocr_confidence.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Global TTS Accessibility Player */}
        <VoiceAssistant textToRead={speechText} title="Clinical Summary Voice Reader" />

        {/* Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Document Preview + AI Summary */}
          <div className="xl:col-span-5 space-y-8">
            
            {/* Image Preview */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Document Preview</h3>
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 aspect-[3/4] flex items-center justify-center p-2">
                <img
                  src={data.image_url ? (data.image_url.startsWith("http") ? data.image_url : `http://127.0.0.1:8000${data.image_url}`) : `https://placehold.co/600x800/1e293b/0f172a?text=${data.filename}`}
                  alt="Prescription"
                  className="max-h-full max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback to beautiful mock placeholder
                    e.currentTarget.src = `https://placehold.co/600x800/1e293b/94a3b8?text=${data.filename}`;
                  }}
                />
              </div>
            </div>

            {/* AI Health Summary */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                AI Diagnostic Overview
              </h3>
              <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 space-y-2">
                <h4 className="text-sm font-bold text-teal-400">Diagnosis Translation</h4>
                <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                  {diagnosis}
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-slate-400 leading-relaxed">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Notes</h4>
                <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 italic">
                  &quot;{data.doctor_notes || "No notes retrieved."}&quot;
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Scores, Schedules, Safety Warnings, Foods */}
          <div className="xl:col-span-7 space-y-8">

            {/* Allergy Alerts (IMMEDIATE SAFETY WARNER) */}
            {allergyAlerts.length > 0 && (
              <div className="p-6 rounded-3xl bg-red-500/10 border-2 border-red-500/30 text-red-300 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-7 w-7 text-red-500 shrink-0" />
                  <div>
                    <h3 className="text-base font-black text-red-400">IMMEDIATE SAFETY WARNING</h3>
                    <p className="text-xs text-red-500 font-bold">ALLERGY CONTRAINDICATION DETECTED</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {allergyAlerts.map((alert: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-red-950/40 border border-red-900/30 text-sm leading-relaxed">
                      <p className="font-extrabold text-red-200">Medication: {alert.medicine}</p>
                      <p className="text-xs text-red-400 font-semibold mt-1">
                        Concern: {alert.warning_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prescription Clarity Score */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Prescription Clarity Score</h3>
                  <p className="text-xs text-slate-500 mt-1">Checks structure, frequencies, and legibility.</p>
                </div>
                <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-slate-800 text-slate-100 font-black text-lg bg-slate-950">
                  <span className={clarityScore >= 80 ? "text-teal-400" : clarityScore >= 60 ? "text-amber-400" : "text-red-400"}>
                    {clarityScore}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Verification Positives</h4>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {clarityReasons.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Missing Field Notices</h4>
                  {missingInfo.length === 0 ? (
                    <p className="text-xs text-slate-500">No missing details observed.</p>
                  ) : (
                    <ul className="text-xs text-slate-400 space-y-1">
                      {missingInfo.map((m: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Medicine Breakdown & Timing Assistant */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Pill className="h-5 w-5 text-indigo-400" />
                Medication timings & details
              </h3>

              <div className="space-y-4">
                {medicines.map((med: any, idx: number) => {
                  const isExpanded = expandedMed === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-800/80 bg-slate-950/40 rounded-2xl overflow-hidden transition-all"
                    >
                      {/* Collapsible Header */}
                      <button
                        onClick={() => setExpandedMed(isExpanded ? null : idx)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-900/20 text-left"
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                            {med.name}
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400">
                              {med.dosage}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500">
                            {med.frequency} | Duration: {med.duration}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                      </button>

                      {/* Timing grid & Detail list */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-900 bg-slate-950/60 space-y-4 text-xs">
                          {/* Schedule block */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Morning</span>
                              <p className="font-semibold text-slate-300">{med.schedule_decoded?.morning || "Skip"}</p>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Afternoon</span>
                              <p className="font-semibold text-slate-300">{med.schedule_decoded?.afternoon || "Skip"}</p>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Night</span>
                              <p className="font-semibold text-slate-300">{med.schedule_decoded?.night || "Skip"}</p>
                            </div>
                          </div>

                          {/* Extended info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                              <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Purpose</span>
                                <p className="text-slate-300">{med.purpose || "General Therapy"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Drug Class</span>
                                <p className="text-slate-300">{med.category || "Unclassified"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Alternatives</span>
                                <p className="text-slate-300">{med.generic_alternatives?.join(", ") || "None listed"}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] text-amber-500">Side Effects</span>
                                <p className="text-slate-300">{med.side_effects?.join(", ") || "None documented"}</p>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] text-amber-500">Precautions</span>
                                <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                                  {med.precautions?.map((p: string, i: number) => <li key={i}>{p}</li>) || <li>Standard use</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Disease-Medicine Suitability Match */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                AI Disease-Medicine Match Analysis
              </h3>
              <div className="space-y-3">
                {diseaseMedMatching.map((match: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-200">Condition: {match.condition}</p>
                      <p className="text-slate-500 font-bold mt-0.5">Assigned drug: {match.medicine}</p>
                      <p className="text-slate-400 mt-1 leading-relaxed">{match.suitability}</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black rounded-lg shrink-0">
                      Appropriate
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                * Note: Matching algorithms are informational guidelines built from general pharmacological datasets. Always cross-check active indications with a primary clinician.
              </p>
            </div>

            {/* Food Recommendations */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-400" />
                Food Recommendation Engine
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Foods to Eat</h4>
                  <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                    {foodRecommendations.eat.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Foods to Avoid</h4>
                  <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                    {foodRecommendations.avoid.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <span className="font-bold text-slate-500 uppercase block mb-1">Medication + Food Timing Guide</span>
                <p className="text-slate-300 leading-relaxed">{foodRecommendations.timing}</p>
              </div>
            </div>

            {/* Preventive Healthcare Engine */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                Preventive Health Guidelines
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">Hydration</span>
                  <p className="text-slate-300">{preventiveCare.hydration}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">Sleep</span>
                  <p className="text-slate-300">{preventiveCare.sleep}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 block mb-1">Exercise & Lifestyle</span>
                  <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                    {preventiveCare.lifestyle.map((l: string, i: number) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-xs space-y-1">
                <span className="font-bold text-red-400 block uppercase">Critical warning signs to monitor</span>
                <p className="text-slate-300 leading-relaxed">{preventiveCare.warning_signs}</p>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
