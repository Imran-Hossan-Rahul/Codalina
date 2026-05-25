"use client";
import React from "react";
import { CheckCircle2, Trophy, Info, Zap } from "lucide-react";

export default function ChallengeCreateSidebar() {
  return (
    <aside className="h-full flex flex-col gap-6 pb-10">
      {/* Deployment Checklist Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm space-y-6 overflow-hidden">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <div className="w-1 h-4 bg-slate-900 dark:bg-white rounded-full" />
          Deployment Tips
        </h3>
        <div className="space-y-4">
          {[
            { title: "Precise Timelines", desc: "Ensure your submission and judging phases don't overlap." },
            { title: "Clear Rubrics", desc: "Well-defined judging criteria attract higher quality submissions." },
            { title: "Brand Assets", desc: "Use a high-resolution cover image to make your challenge stand out." }
          ].map((tip, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5">
                <CheckCircle2 size={12} strokeWidth={1.5} className="text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{tip.title}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reward Strategy Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm space-y-6 overflow-hidden">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <div className="w-1 h-4 bg-slate-900 dark:bg-white rounded-full" />
          Reward Strategy
        </h3>
        <div className="p-4 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Trophy size={16} strokeWidth={1.5} className="text-indigo-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pro Recommendation</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            A distributed prize pool (e.g., Top 3 winners) often yields 40% more high-quality submissions than a single winner-takes-all approach.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
          <Info size={12} strokeWidth={1.5} />
          <span>Tokens are non-refundable</span>
        </div>
      </div>

      {/* Support Card */}
      <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 shadow-xl text-white dark:text-black relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap size={80} strokeWidth={1} />
        </div>
        <div className="relative z-10">
          <h4 className="text-lg font-bold mb-2">Need Assistance?</h4>
          <p className="text-xs opacity-70 leading-relaxed mb-6">Our challenge architects can help you refine your mission briefing and judging criteria.</p>
          <button type="button" className="w-full py-3 bg-white dark:bg-slate-900 text-black dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
            Consult an Architect
          </button>
        </div>
      </div>
    </aside>
  );
}
