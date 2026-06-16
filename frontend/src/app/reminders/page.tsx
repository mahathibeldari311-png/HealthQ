"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import {
  Bell,
  Clock,
  Trash2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Volume2,
  Plus,
  HelpCircle
} from "lucide-react";

export default function MedicationRemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [tabletName, setTabletName] = useState("");
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");
  const [notes, setNotes] = useState("After Breakfast");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Notification states
  const [permissionStatus, setPermissionStatus] = useState<string>("default");
  const lastTriggeredRef = useRef<string>("");

  const formatTime12h = (timeStr: string) => {
    try {
      const [hourStr, minStr] = timeStr.split(":");
      const hour = parseInt(hourStr);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${String(hour12).padStart(2, "0")}:${minStr} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const fetchReminders = async () => {
    try {
      const list = await api.getReminders();
      setReminders(list);
    } catch (err) {
      console.error("Failed to load reminders:", err);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    // Request notification permissions
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((status) => {
          setPermissionStatus(status);
        });
      }
    }
  }, []);

  // Web Audio API Synthesizer to play a premium chime sound arpeggio
  const playAudioChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Play a nice arpeggio: C5 -> E5 -> G5 -> C6
      const notesFreq = [523.25, 659.25, 783.99, 1046.50];
      
      notesFreq.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gainNode.gain.setValueAtTime(0.15, now + idx * 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    } catch (e) {
      console.error("Synthesizer error:", e);
    }
  };

  // Background timer to check reminders every 10 seconds
  useEffect(() => {
    const checkTimer = setInterval(() => {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      
      // If we already triggered reminders for this exact minute, skip to avoid spamming
      if (lastTriggeredRef.current === currentHHMM) {
        return;
      }

      // Filter active reminders that match current time
      const matchingReminders = reminders.filter(
        (r) => r.is_active && r.reminder_time === currentHHMM
      );

      if (matchingReminders.length > 0) {
        lastTriggeredRef.current = currentHHMM;
        
        // Play Chime sound
        playAudioChime();
        
        // Show in-app popup modal
        setActiveAlerts(matchingReminders);
        
        // Trigger browser notification
        matchingReminders.forEach((r) => {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("⏰ Medication Reminder", {
              body: `Time to take your tablet: ${r.tablet_name} (${r.notes || "No notes"})`,
              icon: "/favicon.ico"
            });
          }
        });
      }
    }, 10000);

    return () => clearInterval(checkTimer);
  }, [reminders]);

  const get24hTime = () => {
    let hr = parseInt(hour);
    if (period === "PM" && hr < 12) hr += 12;
    if (period === "AM" && hr === 12) hr = 0;
    return `${String(hr).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = tabletName.trim();
    if (!trimmed) {
      setError("Please specify a tablet name.");
      return;
    }
    
    setLoading(true);
    try {
      const computedTime = get24hTime();
      await api.createReminder({
        tablet_name: trimmed,
        reminder_time: computedTime,
        notes: notes
      });
      setTabletName("");
      await fetchReminders();
    } catch (err: any) {
      setError(err.message || "Failed to create reminder.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.updateReminder(id, { is_active: !currentStatus });
      await fetchReminders();
    } catch (err) {
      console.error("Failed to toggle reminder status:", err);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await api.deleteReminder(id);
      await fetchReminders();
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  const handleTestNotification = () => {
    playAudioChime();
    
    // Show in-app popup modal for test
    setActiveAlerts([
      { tablet_name: "Mock Test Medicine 500mg", notes: "Test Sandbox Guidelines" }
    ]);

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("⏰ HealthQ Test Reminder", {
          body: "This is a test notification for your medication schedule. Alerts are fully configured!",
        });
      } else {
        alert("Notification permissions not granted. Please enable notifications in your browser settings.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <Bell className="h-7 w-7 text-indigo-400 animate-swing" />
            Medication Reminders
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Schedule reminders for taking your tablets and receive desktop notifications with alert arpeggios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Settings */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Schedule Reminder</h3>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tablet Name</label>
                <input
                  type="text"
                  value={tabletName}
                  onChange={(e) => setTabletName(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg, Lipitor..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none placeholder-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reminder Time</label>
                <div className="flex gap-2">
                  {/* Hours Dropdown */}
                  <select
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hr) => (
                      <option key={hr} value={hr}>{hr}</option>
                    ))}
                  </select>
                  
                  {/* Minutes Dropdown */}
                  <select
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((min) => (
                      <option key={min} value={min}>{min}</option>
                    ))}
                  </select>

                  {/* AM/PM Dropdown */}
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Special Guidelines</label>
                <select
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl focus:outline-none"
                >
                  <option value="After Breakfast">After Breakfast</option>
                  <option value="Before Breakfast">Before Breakfast</option>
                  <option value="After Lunch">After Lunch</option>
                  <option value="Before Lunch">Before Lunch</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening / Tea Time">Evening / Tea Time</option>
                  <option value="Before Evening Tea">Before Evening Tea</option>
                  <option value="After Evening Tea">After Evening Tea</option>
                  <option value="After Dinner">After Dinner</option>
                  <option value="Before Dinner">Before Dinner</option>
                  <option value="Before Sleep">Before Sleep</option>
                  <option value="Empty Stomach">Empty Stomach</option>
                  <option value="With Water">With Water</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !tabletName.trim()}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 text-xs font-black rounded-xl hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1"
              >
                <Plus className="h-4.5 w-4.5" />
                Register Reminder
              </button>
            </form>

            {/* Test alert block */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Notification Sandbox</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  permissionStatus === "granted" ? "bg-teal-500/10 text-teal-400" : "bg-amber-500/10 text-amber-400"
                }`}>
                  {permissionStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Make sure to grant browser notification permissions so that you will be alerted even when the page is running in the background.
              </p>
              <button
                onClick={handleTestNotification}
                className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-750 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Volume2 className="h-4 w-4 text-indigo-400" />
                Trigger Test Notification
              </button>
            </div>
          </div>

          {/* Right Column: Reminders List */}
          <div className="lg:col-span-7 space-y-6">
            {reminders.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center text-center border border-dashed border-slate-850 rounded-3xl text-slate-500 bg-slate-900/10">
                <Clock className="h-10 w-10 mb-2 text-slate-600 animate-pulse" />
                <p className="text-sm font-semibold">No reminders scheduled.</p>
                <p className="text-xs mt-1">Register your tablet timings on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between h-44 shadow-lg ${
                      r.is_active 
                        ? "bg-slate-900/40 border-slate-900 hover:border-slate-850" 
                        : "bg-slate-950/20 border-slate-900/40 opacity-60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-lg font-black text-slate-100 truncate pr-2">{r.tablet_name}</span>
                        <button
                          onClick={() => handleDeleteReminder(r.id)}
                          className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="inline-block px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase">
                        {r.notes || "General Intake"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-900/60">
                      {/* Clock Time */}
                      <div className="flex items-center gap-1.5 text-slate-200 font-extrabold text-sm">
                        <Clock className="h-4.5 w-4.5 text-slate-500" />
                        <span>{formatTime12h(r.reminder_time)}</span>
                      </div>
                      
                      {/* Slide toggle */}
                      <button
                        onClick={() => handleToggleActive(r.id, r.is_active)}
                        className={`w-11 h-6 rounded-full transition-all relative border flex items-center ${
                          r.is_active 
                            ? "bg-teal-500 border-teal-500" 
                            : "bg-slate-950 border-slate-850"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-slate-950 absolute transition-all ${
                          r.is_active 
                            ? "right-1 bg-slate-950" 
                            : "left-1 bg-slate-500"
                        }`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Advice */}
            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 text-slate-400 flex items-start gap-3 shadow-xl">
              <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Metabolic Consistency</h4>
                <p className="text-[11px] leading-relaxed font-medium">
                  Taking medications at the exact same hour every day is critical for preserving target therapeutic levels in your bloodstream, preventing blood glucose spikes, or keeping cardiac pressures fully stabilized.
                </p>
              </div>
            </div>
          </div>
        </div>
      {/* Active Reminder Alert Modal Overlay */}
      {activeAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/80 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl shadow-indigo-500/10 transition-all transform scale-100">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center animate-bounce">
              <Bell className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100">Medication Reminder!</h3>
              <p className="text-sm text-slate-400 font-semibold">It is time to take your scheduled tablets:</p>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {activeAlerts.map((alertItem, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-900/60 last:border-b-0">
                  <span className="font-extrabold text-slate-200 text-sm">{alertItem.tablet_name}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-black uppercase">{alertItem.notes || "General Intake"}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const text = `Attention! Time to take your medication: ${activeAlerts.map((a) => a.tablet_name).join(", ")}.`;
                    const u = new SpeechSynthesisUtterance(text);
                    u.rate = 0.95;
                    window.speechSynthesis.speak(u);
                  }
                }}
                className="flex-1 py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-indigo-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Volume2 className="h-4 w-4" />
                Read Aloud
              </button>
              <button
                onClick={() => setActiveAlerts([])}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-indigo-500 text-slate-950 text-xs font-black rounded-xl hover:scale-[1.02] transition-all"
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
