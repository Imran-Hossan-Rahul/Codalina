"use client";
import React from "react";
import Link from "next/link";
import { Plus, Trophy, Zap, Star } from "lucide-react";

export default function ManageChallengesSidebar() {
  return (
    <aside className="h-full flex flex-col gap-6 pb-10">
      {/* Quick Action */}
      <div className="bg-[#0f172a] dark:bg-white/[0.03] rounded-[14px] p-5 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <h3 className="font-bold text-lg mb-1 relative z-10 flex items-center gap-2 tracking-tight">
          <Trophy size={18} strokeWidth={1.5} /> Host a Challenge
        </h3>
        <p className="text-slate-400 text-[11px] mb-5 leading-relaxed font-medium relative z-10">
          Engage the community, discover elite talent, and drive innovation.
        </p>
        <Link 
          href="/challenges/create"
          className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-xl transition-all relative z-10 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={1.5} /> Create New Challenge
        </Link>
      </div>

      {/* Challenge Success Tips */}
      <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-lg p-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Star size={14} strokeWidth={1.5} className="text-purple-600" /> Success Tips
        </h3>
        <div className="space-y-6">
          <div className="flex gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex-shrink-0 flex items-center justify-center text-purple-600 font-bold text-xs">
              <Zap size={14} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 transition-colors">Clear Rubrics</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Define exactly how submissions will be scored to attract high-quality entries.</p>
            </div>
          </div>
          <div className="flex gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-500/10 flex-shrink-0 flex items-center justify-center text-pink-600 font-bold text-xs">
              <Trophy size={14} strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1 group-hover:text-pink-600 transition-colors">Attractive Prizes</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Offer competitive rewards to maximize participation from top developers.</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
