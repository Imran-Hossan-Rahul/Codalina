"use client";
import React, { useState, useEffect } from "react";
import { Zap, Clock, Info, ShieldCheck, ArrowRight } from "lucide-react";
import { api } from "@/utils/api";

export default function ChallengeSubmitSidebar({ challengeId }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) return;
    const fetchChallenge = async () => {
      try {
        const res = await api.get(`/challenges/${challengeId}`);
        if (res.success) setChallenge(res.data);
      } catch (err) {
        console.error("Failed to fetch challenge for sidebar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [challengeId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-3xl" />
        <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <aside className="space-y-6 pb-10">
      {/* Context Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/[0.06] transition-all duration-1000" />
        
        <div className="space-y-8 relative">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <Zap size={14} className="text-amber-500" /> Challenge Dossier
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
           </div>
           
           <div className="space-y-6">
              <div>
                 <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-2">{challenge.title}</h2>
                 <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 border border-slate-200 dark:border-white/10">
                       {challenge.craftsman?.profilePicture ? <img src={challenge.craftsman.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500" />}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">By {challenge.craftsman?.name}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100 dark:border-white/5">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Bounty</p>
                    <p className="text-base font-black text-slate-900 dark:text-white tracking-tighter">{challenge.prize}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Deadline</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-end gap-1.5 mt-0.5">
                       <Clock size={12} className="text-slate-400" />
                       {challenge.endDate ? new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Directives</p>
              <ul className="space-y-4">
                 {[
                   { tip: "Verify repository visibility is set to 'Public'", color: "bg-emerald-500" },
                   { tip: "Detailed README accelerates review cycles", color: "bg-indigo-500" },
                   { tip: "Functional sanity check before deployment", color: "bg-rose-500" }
                 ].map((item, i) => (
                   <li key={i} className="flex gap-3 group/tip">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.color}`} />
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed group-hover/tip:text-slate-900 dark:group-hover/tip:text-white transition-colors">
                         {item.tip}
                      </p>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
        
        <div className="mt-8 pt-4">
           <div className="p-4 bg-slate-50 dark:bg-white/[0.03] rounded-3xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={18} className="text-slate-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secure Protocol</span>
              </div>
              <ArrowRight size={14} className="text-emerald-500" />
           </div>
        </div>
      </div>

      {/* Support Node */}
      <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 space-y-5 shadow-xl shadow-slate-900/10 relative overflow-hidden group">
         <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-full -mb-16 -mr-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
         <div className="space-y-2 relative z-10">
            <p className="text-[9px] font-black text-white/50 dark:text-slate-400 uppercase tracking-[0.3em]">Technical Support</p>
            <p className="text-xs font-bold text-white dark:text-slate-900 leading-relaxed tracking-tight">
               Encountering structural conflicts or transmission errors?
            </p>
         </div>
         <button className="w-full py-3.5 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md border border-white/20 dark:border-slate-900/20 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white dark:text-slate-900 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-all relative z-10 active:scale-95 flex items-center justify-center gap-2">
            Initialize Discord Node <ArrowRight size={12} />
         </button>
      </div>
    </aside>
  );
}

