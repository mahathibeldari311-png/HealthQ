"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FileText,
  Activity,
  Heart,
  PlusCircle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const presPromise = api.getPrescriptions();
        const repPromise = api.getReports();
        const [presData, repData] = await Promise.all([presPromise, repPromise]);
        setPrescriptions(presData);
        setReports(repData);
      } catch (err) {
        console.error("Failed to load dashboard logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const allergyList = user ? JSON.parse(user.allergy_profile || "[]") : [];
  const averageClarity =
    prescriptions.length > 0
      ? Math.round(prescriptions.reduce((sum, item) => sum + (item.clarity_score || 100), 0) / prescriptions.length)
      : 100;

  // Combine items to list recent history
  const combinedHistory = [
    ...prescriptions.map(p => ({
      id: p.id,
      type: "Prescription",
      name: p.filename,
      status: `Clarity: ${p.clarity_score}/100`,
      statusColor: p.clarity_score > 80 ? "text-teal-400 bg-teal-500/10 border-teal-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20",
      date: new Date(p.created_at).toLocaleDateString(),
      rawDate: new Date(p.created_at),
      href: `/prescription-analysis/${p.id}`
    })),
    ...reports.map(r => ({
      id: r.id,
      type: "Medical Report",
      name: r.filename,
      status: r.health_status,
      statusColor: r.health_status.includes("Expected") || r.health_status.includes("🟢")
        ? "text-teal-400 bg-teal-500/10 border-teal-500/20"
        : r.health_status.includes("Attention") || r.health_status.includes("🟡")
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-red-400 bg-red-500/10 border-red-500/20",
      date: new Date(r.created_at).toLocaleDateString(),
      rawDate: new Date(r.created_at),
      href: "/report-analyzer" // Direct analyzer screen
    }))
  ]
    .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">
              Welcome, {user?.full_name || "Patient"}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Here is your clinical dashboard and wellness overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/upload-prescription"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-teal-500/5 hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              New Scan
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scanned Prescriptions</p>
              <h3 className="text-2xl font-black text-slate-100 mt-2">{prescriptions.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Analyses</p>
              <h3 className="text-2xl font-black text-slate-100 mt-2">{reports.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="h-6 w-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Clarity Score</p>
              <h3 className="text-2xl font-black text-slate-100 mt-2">{averageClarity}%</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allergens Listed</p>
              <h3 className="text-2xl font-black text-slate-100 mt-2">{allergyList.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Quick Launchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-950/20 via-slate-900/40 to-slate-900/30 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/40 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Prescription Clarity Scanner</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Scan written doctor slips to analyze schedules, decipher shorthand, read precautions, and identify allergens.
              </p>
            </div>
            <Link
              href="/upload-prescription"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-extrabold text-teal-400 hover:text-teal-300 transition-colors group"
            >
              Analyze Prescription
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-slate-900/30 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/40 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Lab Report Interpreter</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Upload CBC, blood sugar, lipid panel, BP, or thyroid sheets to translate results into clear, understandable language.
              </p>
            </div>
            <Link
              href="/report-analyzer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-extrabold text-cyan-400 hover:text-cyan-300 transition-colors group"
            >
              Analyze Lab Report
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-900/60 p-6 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-200">Recent Health Activity</h3>
            <Link
              href="/history"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              View Full History
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center text-slate-500 gap-2 text-sm">
              <Clock className="h-5 w-5 animate-spin" />
              Loading history records...
            </div>
          ) : combinedHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl text-sm">
              No recent scans found. Upload a prescription or lab report to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">File / Activity Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Status Summary</th>
                    <th className="pb-3">Scan Date</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {combinedHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10">
                      <td className="py-4 font-bold text-slate-200">{item.name}</td>
                      <td className="py-4 text-slate-400">{item.type}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500">{item.date}</td>
                      <td className="py-4 text-right">
                        <Link
                          href={item.href}
                          className="text-xs font-bold text-teal-400 hover:underline"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer Safety Callout */}
        <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 text-slate-400 flex items-start gap-4 shadow-xl">
          <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-400">Important Safety Notice</h4>
            <p className="text-xs leading-relaxed">
              HealthQ AI is an educational clinical assistant designed to decode complex prescription abbreviations and lab terminology.
              It **does not replace** doctors, diagnosis, treatment courses, or clinical medical evaluations.
              Always consult qualified healthcare specialists before altering dosage protocols, pausing active medications, or beginning dietary regimes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
