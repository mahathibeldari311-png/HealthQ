"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, Square, Sparkles } from "lucide-react";

interface VoiceAssistantProps {
  textToRead: string;
  title?: string;
}

export default function VoiceAssistant({ textToRead, title = "Clinical Speech Assistant" }: VoiceAssistantProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(0.95); // slightly slower for clinical clarity
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync available voices and handle async loading in browsers
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English voices since medical information is formatted in English
      const englishVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith("en"));
      const availableVoices = englishVoices.length > 0 ? englishVoices : allVoices;
      setVoices(availableVoices);
      
      // Auto-select standard female voice (e.g. Zira) or first available English voice
      if (availableVoices.length > 0) {
        const femaleVoice = availableVoices.find(
          v => v.name.toLowerCase().includes("zira") || 
               v.name.toLowerCase().includes("female") || 
               v.name.toLowerCase().includes("hazel") ||
               v.name.toLowerCase().includes("google us english")
        );
        const defaultVoice = femaleVoice || availableVoices[0];
        setSelectedVoiceName(prev => prev || defaultVoice.name);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  useEffect(() => {
    // Cleanup synthesis on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Cancel speech and reset states if the text to read changes (e.g. user changes prescription or report)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [textToRead]);

  const selectQuickVoice = (gender: "female" | "male") => {
    setVoiceGender(gender);
    
    let nextVoiceName = selectedVoiceName;
    if (gender === "female") {
      const found = voices.find(
        v => v.name.toLowerCase().includes("zira") || 
             v.name.toLowerCase().includes("female") || 
             v.name.toLowerCase().includes("hazel") || 
             v.name.toLowerCase().includes("google us english")
      );
      if (found) nextVoiceName = found.name;
    } else {
      const found = voices.find(
        v => v.name.toLowerCase().includes("david") || 
             v.name.toLowerCase().includes("male") || 
             v.name.toLowerCase().includes("google uk english male") || 
             v.name.toLowerCase().includes("ravi")
      );
      if (found) nextVoiceName = found.name;
    }

    setSelectedVoiceName(nextVoiceName);

    if (isPlaying) {
      // Stop current utterance and start speaking immediately with the new voice selection and pitch
      setTimeout(() => {
        handlePlay({ overrideVoiceName: nextVoiceName, overrideGender: gender });
      }, 150);
    }
  };

  const handlePlay = (options?: { overrideVoiceName?: string; overrideGender?: "female" | "male" }) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    const activeVoiceName = options?.overrideVoiceName || selectedVoiceName;
    const activeGender = options?.overrideGender || voiceGender;

    if (isPaused && !options) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Cancel current speaking
    window.speechSynthesis.cancel();

    // Clean text from markdown formatting or tags
    const cleanText = textToRead
      .replace(/[*#_\-`🟢🟡🔴]/g, "")
      .replace(/OD/g, "Once Daily")
      .replace(/BD/g, "Twice Daily")
      .replace(/TDS/g, "Three Times Daily")
      .replace(/HS/g, "Before Sleep")
      .replace(/AF/g, "After Food")
      .replace(/BF/g, "Before Food");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Select specific voice
    const selectedVoice = voices.find(v => v.name === activeVoiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Configure pitch based on gender configuration (simulated pitch shift)
    if (activeGender === "female") {
      utterance.pitch = 1.25; // Distinct high pitch
    } else {
      utterance.pitch = 0.85; // Distinct low pitch
    }
    
    utterance.rate = rate;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      // Don't reset if it's a normal cancellation/interruption
      if (event.error !== "interrupted" && event.error !== "canceled") {
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      
      // Secondary safety check for browser engine lag/hangs
      setTimeout(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }, 50);
    }
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Description / Status */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={handleTogglePlay}
          className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shrink-0 ${
            isPlaying 
              ? "bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse" 
              : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300"
          }`}
          title={isPlaying ? "Stop reading" : "Start reading"}
        >
          {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <div>
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            {title}
            {isPlaying && (
              <span className="flex items-center gap-0.5 ml-2">
                <span className="w-1 h-3.5 bg-teal-400 rounded-full animate-[bounce_0.8s_infinite]"></span>
                <span className="w-1 h-2 bg-teal-400 rounded-full animate-[bounce_0.8s_infinite_0.2s]"></span>
                <span className="w-1 h-4 bg-teal-400 rounded-full animate-[bounce_0.8s_infinite_0.4s]"></span>
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {isPlaying ? "Reading health summary..." : isPaused ? "Speech paused." : "Click play to listen to explanation."}
          </p>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        {/* Gender Choice */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => selectQuickVoice("female")}
            className={`px-3 py-1.5 rounded-lg transition-all ${voiceGender === "female" ? "bg-teal-500/20 text-teal-400 border border-teal-500/20" : "text-slate-400"}`}
          >
            Female
          </button>
          <button
            onClick={() => selectQuickVoice("male")}
            className={`px-3 py-1.5 rounded-lg transition-all ${voiceGender === "male" ? "bg-teal-500/20 text-teal-400 border border-teal-500/20" : "text-slate-400"}`}
          >
            Male
          </button>
        </div>

        {/* Voice Selector Dropdown */}
        {voices.length > 0 && (
          <select
            value={selectedVoiceName}
            onChange={(e) => {
              const newVoiceName = e.target.value;
              setSelectedVoiceName(newVoiceName);
              
              // Infer gender from voice name
              const nameLower = newVoiceName.toLowerCase();
              const inferredGender = (
                nameLower.includes("zira") || 
                nameLower.includes("female") || 
                nameLower.includes("hazel") ||
                nameLower.includes("heera") ||
                nameLower.includes("google us english")
              ) ? "female" : "male";
              setVoiceGender(inferredGender);

              if (isPlaying) {
                setTimeout(() => {
                  handlePlay({ overrideVoiceName: newVoiceName, overrideGender: inferredGender });
                }, 150);
              }
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-teal-500 max-w-[180px] truncate"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name.replace("Microsoft", "").replace("Desktop", "").trim()}
              </option>
            ))}
          </select>
        )}

        {/* Speed Option */}
        <select
          value={rate}
          onChange={(e) => {
            const newRate = parseFloat(e.target.value);
            setRate(newRate);
            if (isPlaying) {
              setTimeout(() => {
                handlePlay();
              }, 100);
            }
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-teal-500"
        >
          <option value="0.75">Slow (0.75x)</option>
          <option value="0.95">Normal (0.95x)</option>
          <option value="1.15">Fast (1.15x)</option>
        </select>

        {/* Playback controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="p-2 rounded-lg text-amber-400 hover:bg-slate-900 transition-colors"
              title="Pause"
            >
              <Pause className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => handlePlay()}
              className="p-2 rounded-lg text-teal-400 hover:bg-slate-900 transition-colors"
              title="Play"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          )}

          <button
            onClick={handleStop}
            className="p-2 rounded-lg text-red-400 hover:bg-slate-900 transition-colors"
            title="Stop"
            disabled={!isPlaying && !isPaused}
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
