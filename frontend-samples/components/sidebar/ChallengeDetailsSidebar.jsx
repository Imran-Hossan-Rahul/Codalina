"use client";
import React, { useState, useEffect } from "react";
import { Zap, Clock, Trophy, ShieldCheck, ArrowRight, Loader2, Rocket, CheckCircle2 } from "lucide-react";
import { api } from "@/utils/api";
import { DashboardContext } from "@/app/(dashboard)/layout";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CraftsmanHoverCard from "../cards/CraftsmanHoverCard";

export default function ChallengeDetailsSidebar({ challengeId }) {
  const router = useRouter();
  const { user, isGuest, requireAuth } = React.useContext(DashboardContext) || {};
  const { showToast } = useToast();
  
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchChallenge = async () => {
    try {
      const res = await api.get(`/challenges/${challengeId}`);
      if (res.success) {
        setChallenge(res.data);
        if (user) {
          const joined = res.data.participants?.some(p => (p.user?._id || p.user) === user._id);
          const submitted = res.data.submissions?.some(s => (s.user?._id || s.user) === user._id);
          setHasJoined(joined);
          setHasSubmitted(submitted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch challenge for sidebar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!challengeId) return;
    fetchChallenge();
  }, [challengeId, user]);

  const handleJoin = async () => {
    if (isGuest) { requireAuth("accept this challenge"); return; }
    try {
      setIsJoining(true);
      const res = await api.post(`/challenges/${challengeId}/join`);
      if (res.success) {
        showToast("Mission Accepted", "success");
        setHasJoined(true);
        fetchChallenge();
      }
    } catch (error) { 
      showToast(error.message || "Failed to join", "error"); 
    } finally { 
      setIsJoining(false); 
    }
  };

  const submissionEnd = challenge?.phases?.submissionEnd || challenge?.endDate;
  const registrationEnd = challenge?.phases?.registrationEnd;
  const now = new Date();

  // Phase-based gate: status is the primary authority (manual override trumps dates)
  const JOINABLE_STATUSES  = ['registration_open', 'submissions_open', 'active'];
  const SUBMITTABLE_STATUSES = ['submissions_open', 'active'];

  const canJoin = challenge &&
    JOINABLE_STATUSES.includes(challenge.status) &&
    // Date guard: if a registration deadline exists, honour it
    !(registrationEnd && now > new Date(registrationEnd) && challenge.status === 'registration_open');

  const canSubmit = challenge &&
    SUBMITTABLE_STATUSES.includes(challenge.status) &&
    now < new Date(submissionEnd);

  // Human-readable phase context message for closed states
  const getGateMessage = () => {
    if (!challenge) return null;
    const s = challenge.status;
    if (s === 'draft')              return { text: 'Not yet published', icon: '⏳' };
    if (s === 'upcoming')           return { text: `Opens ${challenge.phases?.registrationStart ? new Date(challenge.phases.registrationStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}`, icon: '📅' };
    if (s === 'in_review')          return { text: 'Under review — submissions closed', icon: '🔍' };
    if (s === 'completed')          return { text: 'Mission completed', icon: '✅' };
    if (s === 'cancelled')          return { text: 'Mission cancelled', icon: '❌' };
    if (registrationEnd && now > new Date(registrationEnd) && s === 'registration_open') return { text: 'Registration period ended', icon: '🔒' };
    return null;
  };
  const gateMessage = getGateMessage();
  const isOwner = !isGuest && user && challenge?.craftsman && (challenge.craftsman?._id || challenge.craftsman) === user._id;

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
      {/* Action Card */}
      <div className="bg-black dark:bg-white text-white dark:text-black rounded-3xl p-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-all duration-700" />
        
        <div className="relative z-10 space-y-6">
          {isOwner ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Host Operations</p>
                <p className="text-xl font-black text-slate-900 dark:text-black">Management Mode</p>
              </div>
              <Link 
                href={`/manage-challenges/${challenge._id}`}
                className="w-full py-4 bg-slate-900 dark:bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl active:scale-95"
              >
                <ShieldCheck size={18} /> Manage Mission
              </Link>
            </div>
          ) : !hasJoined ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Mission Bounty</p>
                <p className="text-3xl font-black">{challenge.prize} <span className="text-xs font-bold text-indigo-400 dark:text-indigo-600">TKNS</span></p>
              </div>
              {canJoin ? (
                <button 
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  {isJoining ? <Loader2 size={18} className="animate-spin" /> : <>Accept Mission <ArrowRight size={18} /></>}
                </button>
              ) : (
                <div className="w-full py-3 px-4 bg-white/5 dark:bg-black/5 rounded-xl border border-white/10 dark:border-black/10 flex items-center justify-center gap-2">
                  <span className="text-base">{gateMessage?.icon || '🔒'}</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{gateMessage?.text || 'Registration Closed'}</p>
                </div>
              )}
            </div>
          ) : !hasSubmitted ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-white/5 dark:bg-black/5 rounded-2xl border border-white/10 dark:border-black/10">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white dark:text-black">Mission Accepted</p>
              </div>
              {canSubmit ? (
                <Link 
                  href={`/challenges/${challenge._id}/submit`}
                  className="w-full py-4 bg-white text-black dark:bg-black dark:text-white rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl active:scale-95"
                >
                  <Rocket size={18} /> Submit Artifact
                </Link>
              ) : (
                <div className="w-full py-3 px-4 bg-white/5 dark:bg-black/5 rounded-xl border border-white/10 dark:border-black/10 flex items-center justify-center gap-2">
                  <span className="text-base">{gateMessage?.icon || '🔒'}</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{gateMessage?.text || 'Submissions Closed'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full py-4 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                <Trophy size={16} /> Artifact Deployed
              </div>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                Review in progress
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 dark:border-black/10">
            <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-[0.2em]">
              Secured by Antigravity Protocol
            </p>
          </div>
        </div>
      </div>
      {/* Challenge Dossier Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Zap size={14} className="text-amber-500" /> Challenge Dossier
        </h3>
        
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bounty Pool</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {challenge.prize} <span className="text-[10px] text-slate-500 uppercase font-bold">TKNS</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deadline</p>
               <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {challenge.endDate ? new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                  </p>
               </div>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Difficulty</p>
               <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{challenge.difficulty || "Intermediate"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
           <CraftsmanHoverCard
              userId={challenge.craftsman?._id || challenge.craftsman}
              username={challenge.craftsman?.username}
              avatarUrl={challenge.craftsman?.profilePicture}
              displayName={challenge.craftsman?.name}
           >
              <div className="flex items-center gap-3 cursor-pointer">
                 <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 dark:border-white/10 shrink-0">
                    {challenge.craftsman?.profilePicture ? <img src={challenge.craftsman.profilePicture} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500" />}
                 </div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Host</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight hover:text-slate-600 transition-colors truncate">{challenge.craftsman?.name}</p>
                 </div>
              </div>
           </CraftsmanHoverCard>
        </div>
      </div>

      {/* Strategic Directives Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Strategic Directives</h3>
        <ul className="space-y-4">
           {(() => {
             const directives = [];
             const diff = challenge.difficulty?.toLowerCase() || '';
             
             if (diff === 'advanced' || diff === 'expert') {
               directives.push("Focus on edge cases, performance optimization, and scalable architecture.");
             } else {
               directives.push("High-fidelity code documentation and clear logic speeds up the review process.");
             }
             
             if (challenge.techStack && challenge.techStack.length > 0) {
               directives.push(`Strict adherence to the required tech stack (${challenge.techStack.slice(0, 3).join(', ')}) is mandatory.`);
             } else {
               directives.push("Detailed README with clear setup instructions is required.");
             }
             
             const endDate = challenge.phases?.submissionEnd || challenge.endDate;
             const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
             if (daysLeft <= 3 && daysLeft > 0) {
               directives.push(`Only ${daysLeft} days remaining. Prioritize core functional requirements over nice-to-haves.`);
             } else {
               directives.push("Focus on clean, reusable component architecture and modular design patterns.");
             }

             return directives.map((tip, i) => (
               <li key={i} className="flex gap-4 group/tip">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed group-hover/tip:text-slate-900 dark:group-hover/tip:text-white transition-colors">
                     {tip}
                  </p>
               </li>
             ));
           })()}
        </ul>
      </div>    </aside>
  );
}

