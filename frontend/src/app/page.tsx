"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Activity,
  Heart,
  Pill,
  Volume2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      title: "Prescription Intelligence",
      description: "Convert handwriting, complex dosage symbols (BD, OD, HS) and medical shorthand into clear schedules.",
      icon: FileText,
      color: "from-teal-500/20 to-teal-400/5 text-teal-400"
    },
    {
      title: "Health Report Analyzer",
      description: "Extract vital parameters from blood sugar, thyroid, lipid, and BP reports with color status flags.",
      icon: Activity,
      color: "from-cyan-500/20 to-cyan-400/5 text-cyan-400"
    },
    {
      title: "Drug Interaction Checker",
      description: "Add multiple medications to evaluate high-risk clinical interactions and side effects immediately.",
      icon: Pill,
      color: "from-indigo-500/20 to-indigo-400/5 text-indigo-400"
    },
    {
      title: "Food Compatibility Engine",
      description: "Obtain personalized guidelines for meals to enjoy or avoid, plus correct timing relative to medications.",
      icon: Heart,
      color: "from-rose-500/20 to-rose-400/5 text-rose-400"
    },
    {
      title: "Clarity Scoring & Verification",
      description: "Audit prescription completeness by checking for missing instructions, duration, or doctor markings.",
      icon: ShieldCheck,
      color: "from-emerald-500/20 to-emerald-400/5 text-emerald-400"
    },
    {
      title: "Voice-First Accessibility",
      description: "Built-in multilingual text-to-speech option to read clinical explanations and dosages aloud.",
      icon: Volume2,
      color: "from-amber-500/20 to-amber-400/5 text-amber-400"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col">
      {/* Aesthetic glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Nav bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            HealthQ AI
          </span>
        </div>

        <div>
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-bold text-slate-100 rounded-xl transition-all"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-extrabold rounded-xl transition-all hover:opacity-90 hover:scale-[1.02]"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-teal-400 mb-6 shadow-inner">
          <Sparkles className="h-4 w-4" />
          <span>Empowered Medical Report & Prescription Comprehension</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Understand Your Health,{" "}
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Simplify Clinical Data
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          HealthQ decodes handwritten prescriptions, translates complex clinical reports, highlights safety risks, and proposes preventive guidelines.
        </p>

        {/* Warning Alert banner */}
        <div className="mt-6 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold max-w-xl">
          ⚠️ Disclaimer: HealthQ provides informational guidance only and is not a substitute for professional medical advice or diagnoses.
        </div>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-slate-950 text-base font-black rounded-2xl shadow-xl shadow-teal-500/10 hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-base font-bold text-slate-200 rounded-2xl transition-all"
          >
            <BookOpen className="h-5 w-5 text-slate-400" />
            Explore Demo
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-24 w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Innovative Features
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Next-generation accessibility tools for patient awareness
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900/80 hover:border-slate-800 text-left hover:bg-slate-900/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/5 flex items-center justify-center mb-5`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-200">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-600 z-10 mt-12">
        <p>© 2026 HealthQ AI Clinical Assistant. Built with Next.js, FastAPI, and Google Gemini API.</p>
        <p className="mt-1">For general information and wellness tracking. Always check with primary care physicians before modifying drug regimens.</p>
      </footer>
    </div>
  );
}
