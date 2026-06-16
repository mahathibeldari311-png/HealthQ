"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import {
  FileText,
  Activity,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  Clock,
  AlertCircle
} from "lucide-react";

export default function HistoryPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Prescriptions" | "Reports">("All");

  const fetchData = async () => {
    setLoading(true);
    try {
      const presPromise = api.getPrescriptions();
      const repPromise = api.getReports();
      const [presData, repData] = await Promise.all([presPromise, repPromise]);
      setPrescriptions(presData);
      setReports(repData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number, type: "Prescription" | "Report") => {
    const check = confirm(`Are you sure you want to delete this ${type.toLowerCase()} record?`);
    if (!check) return;
    
    try {
      if (type === "Prescription") {
        await api.deletePrescription(id);
        setPrescriptions(prescriptions.filter(p => p.id !== id));
      } else {
        await api.deleteReport(id);
        setReports(reports.filter(r => r.id !== id));
      }
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  // Compile items
  const compiledItems = [
    ...prescriptions.map(p => ({
      id: p.id,
      type: "Prescription",
      name: p.filename,
      score: p.clarity_score,
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
      score: null,
      status: r.health_status,
      statusColor: r.health_status.includes("Expected") || r.health_status.includes("🟢")
        ? "text-teal-400 bg-teal-500/10 border-teal-500/20"
        : r.health_status.includes("Attention") || r.health_status.includes("🟡")
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-red-400 bg-red-500/10 border-red-500/20",
      date: new Date(r.created_at).toLocaleDateString(),
      rawDate: new Date(r.created_at),
      href: "/report-analyzer"
    }))
  ]
    .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
    .filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      if (categoryFilter === "All") return matchSearch;
      if (categoryFilter === "Prescriptions") return item.type === "Prescription" && matchSearch;
      return item.type === "Medical Report" && matchSearch;
    });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">
            Health History Logs
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Search, filter, inspect details, or delete previously processed prescriptions and lab reports.
          </p>
        </div>

        {/* Filter controls */}
        <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-xs font-bold rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Type Category Filter */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold w-full sm:w-auto">
            {(["All", "Prescriptions", "Reports"] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${
                  categoryFilter === cat
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lists Table */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl shadow-xl">
          {loading ? (
            <div className="py-20 flex items-center justify-center text-slate-500 gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Loading history table...
            </div>
          ) : compiledItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center text-slate-500 space-y-2">
              <AlertCircle className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-semibold">No scan logs matched your criteria.</p>
              <p className="text-xs">Upload prescriptions or lab reports to create logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Record Filename</th>
                    <th className="pb-3">Data Type</th>
                    <th className="pb-3">Status Indicator</th>
                    <th className="pb-3">Upload Date</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {compiledItems.map((item, idx) => {
                    const Icon = item.type === "Prescription" ? FileText : Activity;
                    return (
                      <tr key={idx} className="hover:bg-slate-900/10 group">
                        <td className="py-4 font-bold text-slate-200 flex items-center gap-2 max-w-xs sm:max-w-md">
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${item.type === "Prescription" ? "text-teal-400" : "text-cyan-400"}`} />
                          <span className="truncate">{item.name}</span>
                        </td>
                        <td className="py-4 text-slate-400">{item.type}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${item.statusColor}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 text-slate-500">{item.date}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={item.href}
                              className="text-xs font-bold text-teal-400 hover:underline inline-flex items-center"
                            >
                              Inspect
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.type as any)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
