"use client";
import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { DashboardContext } from "@/app/(dashboard)/layout";
import {
  Trophy, Users, ChevronRight, Plus, Clock, CheckCircle,
  XCircle, Loader2, Zap, FileText, BarChart3
} from "lucide-react";

const STATUS_CONFIG = {
  active:    { label: "Active",    color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", dot: "bg-emerald-500" },
  upcoming:  { label: "Upcoming",  color: "text-amber-500",    bg: "bg-amber-50 dark:bg-amber-900/20",    dot: "bg-amber-500" },
  completed: { label: "Completed", color: "text-slate-400",    bg: "bg-slate-50 dark:bg-white/5",        dot: "bg-slate-400" },
};

export default function ManageChallengesPage() {
  const router = useRouter();
  const { user } = useContext(DashboardContext) || {};
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (user && (user.isHost || user.role === "admin")) fetchMyChallenges();
  }, [user]);

  if (!user) return null;
  if (!user.isHost && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-slate-500 mt-2">Only challenge craftsmen can manage challenges.</p>
      </div>
    );
  }

  const fetchMyChallenges = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/challenges?craftsman=${user._id}`);
      if (res.success && res.data) {
        // Filter specifically for this craftsman
        const myChallenges = res.data.filter(c => c.craftsman?._id === user._id || c.craftsman === user._id);
        setChallenges(myChallenges);
      }
    } catch (err) {
      showToast("Failed to load challenges", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (activeFilter === "All") return true;
    return challenge.status === activeFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanning Grid...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl px-4 pt-[28px] pb-12 animate-in fade-in duration-500">

      {/* Header & Stats Integration */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-[27px] border-b border-slate-100 dark:border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Command Center</h1>
        </div>

        <div className="flex items-center gap-10">
          {["All", "Active", "Upcoming", "Completed"].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative flex flex-col items-center pb-4 transition-all ${
                activeFilter === filter ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                {filter}
              </span>
              {activeFilter === filter && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute bottom-0 w-full h-[2px] bg-slate-900 dark:bg-white"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        
        {filteredChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50 dark:bg-white/[0.02] rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
            <Trophy size={48} strokeWidth={1} className="text-gray-300 dark:text-white/10 mb-6" />
            <h3 className="text-xl font-bold text-gray-300 dark:text-white/20 uppercase tracking-widest">No {activeFilter !== 'All' ? activeFilter : ''} Challenges</h3>
            <p className="text-sm text-slate-400 mt-2">Initialize your first competition to build a community.</p>
            <button
              onClick={() => router.push("/challenges/create")}
              className="mt-8 px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
            >
              Start Hosting
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.map(challenge => {
              const status = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.active;
              const subCount = challenge.submissions?.length || 0;
              const partCount = challenge.participants?.length || 0;

              return (
                <div
                  key={challenge._id}
                  onClick={() => router.push(`/challenges/${challenge._id}/manage`)}
                  className="group flex items-center gap-5 p-5 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl hover:border-slate-300 dark:hover:border-white/15 hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  {/* Preview Image or Icon */}
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/50">
                    {challenge.coverImage ? (
                        <img src={challenge.coverImage} className="w-full h-full object-cover" />
                    ) : (
                        <Trophy size={20} className="text-slate-300" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{challenge.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5"><Users size={12} className="text-blue-500" />{partCount} participants</span>
                      <span className="flex items-center gap-1.5"><FileText size={12} className="text-indigo-500" />{subCount} submissions</span>
                      <span className="flex items-center gap-1.5 capitalize">{challenge.type}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} />{new Date(challenge.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action & Status */}
                  <div className="flex items-center gap-6 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.bg} ${status.color} flex items-center`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-2`} />
                      {status.label}
                    </span>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


