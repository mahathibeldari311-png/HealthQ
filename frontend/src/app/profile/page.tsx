"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Edit2,
  Check,
  Sparkles
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile, updateAllergies } = useAuth();
  
  // Demographics
  const [fullName, setFullName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Allergies
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentAllergen, setCurrentAllergen] = useState("");
  const [allergyMsg, setAllergyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      // Draw seed from avatar url or default to name
      const defaultSeed = user.full_name || user.email.split("@")[0];
      setAvatarSeed(defaultSeed);
      
      try {
        setAllergies(JSON.parse(user.allergy_profile || "[]"));
      } catch (err) {
        setAllergies([]);
      }
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const generatedAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(avatarSeed)}`;
      await updateProfile(fullName, generatedAvatar);
      setIsEditingProfile(false);
      setProfileMsg("🟢 Profile details updated successfully.");
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setProfileMsg("🔴 Failed to update details.");
    }
  };

  const handleAddAllergen = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllergyMsg(null);
    const trimmed = currentAllergen.trim();
    if (!trimmed) return;

    if (allergies.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      setAllergyMsg(`🔴 "${trimmed}" is already cataloged.`);
      return;
    }

    const updated = [...allergies, trimmed];
    try {
      await updateAllergies(updated);
      setAllergies(updated);
      setCurrentAllergen("");
      setAllergyMsg("🟢 Allergy profile saved.");
      setTimeout(() => setAllergyMsg(null), 2000);
    } catch (err) {
      setAllergyMsg("🔴 Failed to save allergen.");
    }
  };

  const handleRemoveAllergen = async (index: number) => {
    setAllergyMsg(null);
    const updated = allergies.filter((_, idx) => idx !== index);
    try {
      await updateAllergies(updated);
      setAllergies(updated);
      setAllergyMsg("🟢 Allergen removed.");
      setTimeout(() => setAllergyMsg(null), 2000);
    } catch (err) {
      setAllergyMsg("🔴 Failed to remove allergen.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 lg:pl-72 p-6 md:p-8 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <User className="h-7 w-7 text-teal-400" />
            Patient Profile
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Manage your personal clinical credentials, avatars, and high-risk allergy registry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PROFILE CARD */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Demographic Details</h3>
              
              {profileMsg && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
                  {profileMsg}
                </div>
              )}

              <div className="flex items-center gap-4">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl border border-slate-800 bg-slate-950 p-1 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-extrabold text-slate-200 truncate">{user?.full_name}</h4>
                  <p className="text-xs text-slate-500 font-bold truncate flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email}
                  </p>
                </div>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSave} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avatar Seed (changes graphics)</label>
                    <input
                      type="text"
                      value={avatarSeed}
                      onChange={(e) => setAvatarSeed(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-200 focus:outline-none"
                      placeholder="e.g. Joy"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-slate-950 text-xs font-extrabold rounded-xl"
                    >
                      <Check className="h-4 w-4" />
                      Save Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-all"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  Edit Profile Details
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              * Note: Profile credentials reside in secure clinical storage databases. Your profile is automatically linked to the scan engines.
            </div>
          </div>

          {/* ALLERGY PROFILE CARD */}
          <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-red-500" />
                Allergy Registry
              </h3>

              {allergyMsg && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
                  {allergyMsg}
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                Add drug molecules or allergen groups (e.g. **Penicillin**, **Sulfa drugs**, **Aspirin**) to automatically scan prescriptions for safety issues.
              </p>

              <form onSubmit={handleAddAllergen} className="flex gap-2">
                <input
                  type="text"
                  value={currentAllergen}
                  onChange={(e) => setCurrentAllergen(e.target.value)}
                  placeholder="e.g. Penicillin..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-500/40 rounded-xl text-xs font-bold text-slate-200 focus:outline-none placeholder-slate-700"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-red-400 rounded-xl flex items-center justify-center transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>

              {/* Allergen Tag List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Allergen Profile</span>
                {allergies.length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-2">No allergens listed. Scanner safety checks will be bypass-active.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergen, idx) => (
                      <span
                        key={idx}
                        className="pl-3 pr-1.5 py-1.5 bg-slate-950 border border-red-500/10 rounded-xl text-xs font-extrabold text-slate-200 flex items-center gap-2"
                      >
                        {allergen}
                        <button
                          onClick={() => handleRemoveAllergen(idx)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                Scanner alerts automatically test medications against this list during uploads. Keep this database updated!
              </span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
