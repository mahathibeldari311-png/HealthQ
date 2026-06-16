"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import VoiceAssistant from "@/components/VoiceAssistant";
import { api } from "@/lib/api";
import {
  Heart,
  ShieldAlert,
  Droplet,
  Compass,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock
} from "lucide-react";

export default function PreventiveCarePage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presData, repData] = await Promise.all([
          api.getPrescriptions(),
          api.getReports()
        ]);
        setPrescriptions(presData);
        setReports(repData);
      } catch (err) {
        console.error("Failed to load health history for preventive planner:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Check if user has high BP or sugar from latest report
  const latestReport = reports.length > 0 ? reports[0] : null;
  const latestReportStruct = latestReport?.structured_data || {};
  const reportExplanation = latestReportStruct.simple_explanation || "";
  const reportStatus = latestReport?.health_status || "";

  // Compile conditions detected
  const isDiabeticRisk = reportExplanation.toLowerCase().includes("diabetic") || reportExplanation.toLowerCase().includes("blood sugar") || reportExplanation.toLowerCase().includes("glucose");
  const isHypertensionRisk = reportExplanation.toLowerCase().includes("hypertension") || reportExplanation.toLowerCase().includes("blood pressure") || reportExplanation.toLowerCase().includes("bp");

  const recommendations = {
    hydration: "Drink 3.0 to 3.5 liters of clean water daily. Track intake in the morning and evening.",
    sleep: "Aim for 7.5 to 8.5 hours of dark-room sleep. Rest is core to metabolic homeostasis.",
    exercise: [
      "Engage in 30 minutes of brisk walking, 5 days a week.",
      "Incorporate 10-15 minutes of dynamic stretches every morning."
    ],
    diet: [
      "Reduce daily salt intake to less than 5 grams.",
      "Prioritize green fibrous vegetables, almonds, oats, and whole grains."
    ],
    monitoring: [
      "Track blood pressure twice daily (morning and night) if elevated.",
      "Check fasting blood glucose levels once a week."
    ],
    warningSigns: "Consult your clinical provider immediately if you experience breathing tightness, sudden vision blur, or a resting heart rate exceeding 100 bpm."
  };

  // Adjust suggestions dynamically if reports contain elevated items
  if (isDiabeticRisk) {
    recommendations.diet.unshift("Pause direct sugars, high-glycemic juices, and simple carbohydrates.");
    recommendations.monitoring.unshift("Log fasting blood sugar twice weekly.");
  }
  if (isHypertensionRisk) {
    recommendations.diet.unshift("Strictly monitor hidden sodium in canned foods/sauces.");
    recommendations.exercise.unshift("Avoid heavy anaerobic lifting without a warm-up; prioritize steady cardiovascular exercises.");
  }

  const speechText = `
    Preventive Health Guidelines.
    Based on your profile, here are the recommendations.
    Hydration: ${recommendations.hydration}.
    Sleep: ${recommendations.sleep}.
    Exercise suggestions: ${recommendations.exercise.join(" ")}.
    Diet suggestions: ${recommendations.diet.join(" ")}.
    Monitoring recommendations: ${recommendations.monitoring.join(" ")}.
    Critical Warning Signs: ${recommendations.warningSigns}.
  `;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <Heart className="h-7 w-7 text-rose-400" />
            Preventive Care Hub
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Personalized lifestyle guidelines, physical exercise rules, and metrics monitoring plans compiled from your records.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center text-slate-500 gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Compiling clinical rules...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TTS accessibility widget */}
            <VoiceAssistant textToRead={speechText} title="Preventive Guidelines Voice Reader" />

            {/* Health risk callouts */}
            {(isDiabeticRisk || isHypertensionRisk) && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-slate-300 space-y-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
                  <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">Dynamic Risk Factors Flagged</h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Your latest medical scans indicate flags relating to{" "}
                  {isDiabeticRisk && isHypertensionRisk
                    ? "Glucose metabolism and Blood Pressure."
                    : isDiabeticRisk
                    ? "Glucose metabolism / HbA1c."
                    : "Cardiovascular Blood Pressure."}{" "}
                  We have automatically adapted your hydration, exercise, and monitoring goals.
                </p>
              </div>
            )}

            {/* Core Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Hydration & Sleep */}
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-fit">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-200">Hydration & Rest</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Daily Hydration</span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{recommendations.hydration}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sleep Quality</span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{recommendations.sleep}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Diet & Exercise */}
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-200">Dietary & Training Habits</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nutrition Guidelines</span>
                      <ul className="list-disc pl-4 text-xs text-slate-300 mt-1 space-y-1">
                        {recommendations.diet.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aerobic Activities</span>
                      <ul className="list-disc pl-4 text-xs text-slate-300 mt-1 space-y-1">
                        {recommendations.exercise.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Metrics monitoring & warning limits */}
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-fit">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-200">Home Vital Monitoring</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vitals Checklist</span>
                      <ul className="list-disc pl-4 text-xs text-slate-300 mt-1 space-y-1">
                        {recommendations.monitoring.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-500/5 border border-red-500/15 text-xs text-slate-400 rounded-2xl">
                  <span className="font-bold text-red-400 block mb-0.5 uppercase text-[10px]">Warning thresholds</span>
                  <p className="text-[11px] leading-relaxed">{recommendations.warningSigns}</p>
                </div>
              </div>

            </div>

            {/* General Advice Badge Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950/20 to-slate-900/40 border border-slate-900 flex items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-teal-400 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Health Grade Checklist
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Preventive practices lower lifetime cardiovascular risk levels. Establish a consistent baseline routine.
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-black rounded-xl shrink-0">
                Informational AI Guidance
              </span>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
