"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import VoiceAssistant from "@/components/VoiceAssistant";
import { api } from "@/lib/api";
import {
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  History,
  ShieldCheck,
  Zap,
  Clock,
  Activity,
  User,
  Scale,
  ArrowRight,
  ShieldAlert,
  Info
} from "lucide-react";

export default function DrugInteractionPage() {
  const [activeTab, setActiveTab] = useState<"interactions" | "symptoms">("interactions");

  // --- Drug Interaction Checker States ---
  const [medicines, setMedicines] = useState<string[]>([]);
  const [currentMed, setCurrentMed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // --- Symptom-to-Medicine Adviser States ---
  const [age, setAge] = useState<number | "">(30);
  const [gender, setGender] = useState("Male");
  const [weight, setWeight] = useState<number | "">(70);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [symptomResult, setSymptomResult] = useState<any | null>(null);
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [symptomError, setSymptomError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const logs = await api.getInteractionHistory();
      setHistory(logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- Drug Interaction Handler Functions ---
  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = currentMed.trim();
    if (!trimmed) return;
    
    if (medicines.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already added.`);
      return;
    }
    
    setMedicines([...medicines, trimmed]);
    setCurrentMed("");
  };

  const handleRemoveMed = (index: number) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const handleCheck = async () => {
    if (medicines.length < 2) {
      setError("Please add at least 2 medicines to perform an interaction analysis.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null); // Clear previous result during loading
    try {
      const res = await api.checkInteractions(medicines);
      setResult(res);
      await fetchHistory();
    } catch (err: any) {
      setError(err.message || "Failed to analyze drug interactions.");
    } finally {
      setLoading(false);
    }
  };

  // --- Symptom Checker Handler Functions ---
  const handleSymptomCheck = async () => {
    if (!symptoms.trim() || !duration.trim()) {
      setSymptomError("Please fill out both symptoms and duration fields.");
      return;
    }
    setSymptomLoading(true);
    setSymptomError(null);
    setSymptomResult(null); // Clear previous result during loading
    try {
      const res = await api.checkSymptoms({
        age: age === "" ? 30 : age,
        gender,
        weight: weight === "" ? 70.0 : weight,
        symptoms,
        duration
      });
      setSymptomResult(res);
    } catch (err: any) {
      setSymptomError(err.message || "Failed to analyze symptoms.");
    } finally {
      setSymptomLoading(false);
    }
  };

  const status = result?.result_status || "Safe";
  const explanation = result?.explanation || "";
  const recommendations = result?.recommendations || [];

  const speechText = `
    Drug Interaction Check.
    Tested Medications: ${medicines.join(", ")}.
    Status: ${status}.
    Explanation: ${explanation}.
    Recommendations: ${recommendations.join(" ")}.
  `;

  const symptomSpeechText = symptomResult
    ? `Symptom Analysis Report.
       Severity: ${symptomResult.severity}.
       Advisory Notes: ${symptomResult.advisory_notes}.
       ${symptomResult.should_see_doctor ? `Warning: ${symptomResult.doctor_recommendation_text}` : ""}
       Suggested Medications: ${
         symptomResult.suggested_medicines && symptomResult.suggested_medicines.length > 0
           ? symptomResult.suggested_medicines.map((m: any) => m.name).join(", ")
           : "None recommended, please see a doctor."
       }`
    : "";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <Pill className="h-7 w-7 text-indigo-400" />
            Medication Safety & Triage Center
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Analyze drug-to-drug interactions or receive guided OTC medicine schedules based on your symptoms.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-900 max-w-lg">
          <button
            onClick={() => setActiveTab("interactions")}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "interactions"
                ? "bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="h-4 w-4 shrink-0" />
            Drug Interaction Checker
          </button>
          <button
            onClick={() => setActiveTab("symptoms")}
            className={`flex-1 py-3 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "symptoms"
                ? "bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 shadow-lg"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-4 w-4 shrink-0" />
            Symptom-to-Medicine Adviser
          </button>
        </div>

        {activeTab === "interactions" ? (
          /* ==================== DRUG-TO-DRUG INTERACTION CHECKER ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CONTROL BOX: Input list (Left 5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Add Medications</h3>
                
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleAddMed} className="flex gap-2">
                  <input
                    type="text"
                    value={currentMed}
                    onChange={(e) => setCurrentMed(e.target.value)}
                    placeholder="e.g. Aspirin, Lipitor..."
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none placeholder-slate-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-teal-400 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </form>

                {/* Tag Cloud */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medication List</span>
                  {medicines.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-2">No medications added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {medicines.map((med, idx) => (
                        <span
                          key={idx}
                          className="pl-3 pr-1.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-extrabold text-slate-200 flex items-center gap-2"
                        >
                          {med}
                          <button
                            onClick={() => handleRemoveMed(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCheck}
                  disabled={medicines.length < 2 || loading}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-black rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {loading ? "Running AI Interaction Check..." : "Verify Drug Interactions"}
                </button>
              </div>

              {/* Quick Demo Autoselect */}
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Test Scenarios</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setMedicines(["Aspirin", "Warfarin"])}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-300 hover:border-slate-700 transition-all animate-pulse hover:animate-none"
                  >
                    🔴 High Risk: Aspirin + Warfarin
                  </button>
                  <button
                    onClick={() => setMedicines(["Atorvastatin", "Clarithromycin"])}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-300 hover:border-slate-700 transition-all"
                  >
                    🟡 Mod Risk: Atorvastatin + Clarithromycin
                  </button>
                </div>
              </div>
            </div>

            {/* RESPONSE: Detail panels (Right 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {!result ? (
                <div className="h-64 flex flex-col justify-center items-center text-center border border-dashed border-slate-800 rounded-3xl text-slate-500 bg-slate-900/10">
                  <HelpCircle className="h-10 w-10 mb-2 text-slate-600" />
                  <p className="text-sm font-semibold">No active analysis loaded.</p>
                  <p className="text-xs mt-1">Add medications on the left and run analysis.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Voice accessibility player */}
                  <VoiceAssistant textToRead={speechText} title="Interaction Analysis Voice Reader" />

                  {/* Response Card */}
                  <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 shadow-xl">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interaction Risk</span>
                        <h4 className={`text-lg font-black mt-0.5 ${
                          status.includes("High") ? "text-red-400 animate-pulse" : status.includes("Moderate") ? "text-amber-400" : "text-teal-400"
                        }`}>
                          {status}
                        </h4>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        {status.includes("High") ? (
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        ) : status.includes("Moderate") ? (
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-teal-400" />
                        )}
                      </div>
                    </div>

                    {/* Mechanism Explanation */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed">
                      <span className="font-bold text-slate-500 uppercase block tracking-wider">Pharmacological Mechanism</span>
                      <p className="text-slate-300 font-semibold">{explanation}</p>
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actionable Safety Recommendations</h4>
                        <ul className="space-y-2">
                          {recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 flex items-start gap-2">
                              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* History checks summary */}
                    {history.length > 0 && (
                      <div className="pt-4 border-t border-slate-900 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="h-4 w-4 text-slate-500" />
                          Previous Check Session Logs
                        </h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {history.slice(0, 5).map((h) => (
                            <div key={h.id} className="p-3 bg-slate-950 border border-slate-900/60 rounded-xl text-[11px] flex justify-between items-center">
                              <div>
                                <p className="font-extrabold text-slate-300">{h.medicines.join(" + ")}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                h.result_status.includes("High") ? "bg-red-500/10 text-red-400" : h.result_status.includes("Moderate") ? "bg-amber-500/10 text-amber-400" : "bg-teal-500/10 text-teal-400"
                              }`}>
                                {h.result_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==================== SYMPTOM-TO-MEDICINE ADVISER ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CONTROL BOX: Form (Left 5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Patient Triage Profile</h3>

                {symptomError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    <span>{symptomError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3 text-indigo-400" /> Age (Years)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value === "" ? "" : parseInt(e.target.value))}
                      min="1"
                      max="120"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Scale className="h-3 w-3 text-indigo-400" /> Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      min="1"
                      max="300"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Symptoms & Issues</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                    placeholder="Describe symptoms clearly e.g. chest pain, mild fever, throat pain..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none resize-none placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" /> Symptom Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 2 days, 1 week"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none placeholder-slate-600"
                  />
                </div>

                <button
                  onClick={handleSymptomCheck}
                  disabled={!symptoms.trim() || !duration.trim() || symptomLoading}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 text-xs font-black rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {symptomLoading ? "Consulting Clinical Adviser AI..." : "Request Medicine Guidance"}
                </button>
              </div>

              {/* Symptom Checker Scenarios */}
              <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Diagnostic Presets</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setAge(28);
                      setGender("Male");
                      setWeight(75);
                      setSymptoms("Mild fever, sore throat, and dry cough");
                      setDuration("2 days");
                    }}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-300 hover:border-slate-700 transition-all flex items-center justify-between"
                  >
                    <span>🟢 Mild: Fever & Dry Cough (2 days)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
                  </button>
                  <button
                    onClick={() => {
                      setAge(35);
                      setGender("Female");
                      setWeight(62);
                      setSymptoms("Fever and itchy runny nose");
                      setDuration("5 days");
                    }}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-300 hover:border-slate-700 transition-all flex items-center justify-between"
                  >
                    <span>🟡 Mod: Prolonged Fever (5 days)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  </button>
                  <button
                    onClick={() => {
                      setAge(55);
                      setGender("Male");
                      setWeight(85);
                      setSymptoms("Severe chest pain, shortness of breath, and fainting");
                      setDuration("1 day");
                    }}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs font-bold text-slate-300 hover:border-slate-700 transition-all flex items-center justify-between shadow-lg shadow-red-950/20"
                  >
                    <span>🔴 Emergency: Chest Pain & Dizziness (1 day)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* RESPONSE: Detail panels (Right 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {!symptomResult ? (
                <div className="h-64 flex flex-col justify-center items-center text-center border border-dashed border-slate-800 rounded-3xl text-slate-500 bg-slate-900/10">
                  <HelpCircle className="h-10 w-10 mb-2 text-slate-600" />
                  <p className="text-sm font-semibold">No active analysis loaded.</p>
                  <p className="text-xs mt-1">Enter symptom details on the left and run analysis.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Voice accessibility player */}
                  <VoiceAssistant textToRead={symptomSpeechText} title="Symptom Analysis Voice Reader" />

                  {/* Analysis Report Card */}
                  <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 shadow-xl">
                    {/* Severity Banner */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Symptom Severity</span>
                        <h4 className={`text-lg font-black mt-0.5 ${
                          symptomResult.severity === "Severe" ? "text-red-400 animate-pulse" : symptomResult.severity === "Moderate" ? "text-amber-400" : "text-teal-400"
                        }`}>
                          {symptomResult.severity}
                        </h4>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        {symptomResult.severity === "Severe" ? (
                          <ShieldAlert className="h-6 w-6 text-red-500" />
                        ) : symptomResult.severity === "Moderate" ? (
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-teal-400" />
                        )}
                      </div>
                    </div>

                    {/* Emergency doctor warn */}
                    {symptomResult.should_see_doctor && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-400 animate-bounce" />
                        <div className="space-y-1">
                          <span className="font-bold uppercase text-xs tracking-wider block">Doctor Recommendation Required</span>
                          <p className="text-xs font-semibold leading-relaxed">{symptomResult.doctor_recommendation_text}</p>
                        </div>
                      </div>
                    )}

                    {/* General Advisory Notes */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed">
                      <span className="font-bold text-slate-500 uppercase block tracking-wider">Clinical Care & Advisory Notes</span>
                      <p className="text-slate-300 font-semibold">{symptomResult.advisory_notes}</p>
                    </div>

                    {/* Suggested OTC Medicines */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="h-4 w-4 text-indigo-400" />
                        Suggested OTC Medication Schedule
                      </h4>
                      
                      {(!symptomResult.suggested_medicines || symptomResult.suggested_medicines.length === 0) ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-center text-xs text-slate-500 italic">
                          No OTC medicines recommended. Please seek professional clinical consultation.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {symptomResult.suggested_medicines.map((med: any, idx: number) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="text-sm font-black text-slate-200">{med.name}</h5>
                                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{med.purpose}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-black shrink-0">
                                  {med.dosage}
                                </span>
                              </div>

                              {/* Schedule Grids */}
                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
                                <div className="p-2 bg-slate-900/40 rounded-xl border border-slate-900 text-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Morning</span>
                                  <span className={`text-[10px] font-semibold ${(!med.schedule_decoded?.morning || med.schedule_decoded.morning === "Skip") ? "text-slate-600" : "text-teal-400 font-bold"}`}>
                                    {med.schedule_decoded?.morning || "Skip"}
                                  </span>
                                </div>
                                <div className="p-2 bg-slate-900/40 rounded-xl border border-slate-900 text-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Afternoon</span>
                                  <span className={`text-[10px] font-semibold ${(!med.schedule_decoded?.afternoon || med.schedule_decoded.afternoon === "Skip") ? "text-slate-600" : "text-teal-400 font-bold"}`}>
                                    {med.schedule_decoded?.afternoon || "Skip"}
                                  </span>
                                </div>
                                <div className="p-2 bg-slate-900/40 rounded-xl border border-slate-900 text-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider mb-1">Night</span>
                                  <span className={`text-[10px] font-semibold ${(!med.schedule_decoded?.night || med.schedule_decoded.night === "Skip") ? "text-slate-600" : "text-teal-400 font-bold"}`}>
                                    {med.schedule_decoded?.night || "Skip"}
                                  </span>
                                </div>
                              </div>

                              {/* Precautions */}
                              {med.precautions && med.precautions.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Safety Precautions</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {med.precautions.map((prec: string, pIdx: number) => (
                                      <span key={pIdx} className="px-2 py-1 bg-red-500/5 border border-red-500/10 text-red-400 rounded-lg text-[10px] font-semibold">
                                        {prec}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Disclaimer */}
                    <div className="pt-4 border-t border-slate-900 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
                      <Info className="h-4.5 w-4.5 text-slate-600 shrink-0 mt-0.5" />
                      <p>
                        Disclaimer: This tool provides guided suggestions based on common clinical practices and AI assessments. It is for informational purposes only and does NOT constitute professional medical advice, diagnosis, or treatment. Always consult a certified healthcare professional before starting any new medication.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
