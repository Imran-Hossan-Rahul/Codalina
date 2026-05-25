"use client";
import React from "react";
import { Trophy, Clock, Users, ArrowRight, ArrowUpRight, Zap, Heart } from "lucide-react";
import { api } from "@/utils/api";
import { showToast } from "@/utils/toast";
import Link from "next/link";
import { motion } from "framer-motion";
import CraftsmanHoverCard from "../cards/CraftsmanHoverCard";

export const ChallengeCard = ({ challenge, isGuest, onRequireAuth }) => {
  const [isFavorited, setIsFavorited] = React.useState(challenge.isFavorited);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isGuest) { onRequireAuth?.('save'); return; }
    
    const newStatus = !isFavorited;
    setIsFavorited(newStatus);
    try {
        await api.post('/favorites/toggle', { postId: challenge._id, itemType: 'challenge' });
    } catch (err) {
        console.error("Favorite failed", err);
        setIsFavorited(!newStatus);
        showToast("Failed to update saved status", "error");
    }
  };
  // Use the new phases structure if it exists, fallback to standard dates
  const phases = challenge.phases || {};
  const submissionEnd = phases.submissionEnd || challenge.endDate;
  const registrationStart = phases.registrationStart || challenge.startDate;
  
  const timeLeft = new Date(submissionEnd) - new Date();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  
  // Phase logic
  const now = new Date();
  let currentPhase = "Registration";
  let isActive = true;
  let statusColor = "bg-emerald-500 text-white";

  if (now < new Date(registrationStart)) {
    currentPhase = "Upcoming";
    isActive = false;
    statusColor = "bg-slate-800 text-slate-300";
  } else if (now > new Date(submissionEnd)) {
    isActive = false;
    if (phases.judgingStart && now > new Date(phases.judgingStart) && now < new Date(phases.judgingEnd)) {
      currentPhase = "Judging in Progress";
      statusColor = "bg-amber-500 text-white";
    } else if (challenge.status === 'completed') {
      currentPhase = "Completed";
      statusColor = "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400";
    } else {
      currentPhase = "Under Review";
      statusColor = "bg-indigo-500 text-white";
    }
  } else {
    currentPhase = "Submissions Open";
    statusColor = "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20";
  }

  const isCompleted = challenge.status === 'completed';

  return (
    <Link href={`/challenges/${challenge._id}`}>
      <motion.div 
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`group relative bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 ${isCompleted ? 'opacity-80' : ''}`}
      >
        {/* Cover Image */}
        <div className="h-56 relative overflow-hidden bg-slate-50 dark:bg-black/40">
          {challenge.coverImage ? (
            <img src={challenge.coverImage} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative opacity-20 group-hover:opacity-30 transition-opacity duration-500 bg-indigo-600">
               <Trophy size={80} className="text-white mix-blend-overlay" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
          
          {/* Top Badges */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
             <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md bg-white/90 dark:bg-black/90 text-slate-900 border border-white/10 shadow-lg">
                 {currentPhase}
             </span>
             
              <div className="flex items-center gap-2">
                 <button 
                    onClick={handleFavorite}
                    className={`bg-white/90 dark:bg-black/90 backdrop-blur-xl p-2 rounded-full border border-white/10 flex items-center justify-center shadow-lg transition-all ${
                        isFavorited ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                    }`}
                 >
                    <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
                 </button>
                 
                 <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                     <Trophy size={14} className="text-slate-400" />
                     <span className="text-xs font-bold text-slate-900 dark:text-white">{challenge.prize}</span>
                 </div>
              </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-8">
          <CraftsmanHoverCard 
            userId={challenge.craftsman?._id || challenge.craftsman}
            username={challenge.craftsman?.username}
            avatarUrl={challenge.craftsman?.profilePicture}
            displayName={challenge.craftsman?.name}
          >
            <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-white/5">
                  {challenge.craftsman?.profilePicture && challenge.craftsman.profilePicture !== "" ? (
                     <img src={challenge.craftsman.profilePicture} alt="Host" className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-[10px] font-bold text-slate-500">{challenge.craftsman?.name?.charAt(0) || 'P'}</span>
                  )}
               </div>
               <p className="text-xs font-medium text-slate-500">By {challenge.craftsman?.name || 'Platform'}</p>
            </div>
          </CraftsmanHoverCard>

          <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight transition-colors mb-3 line-clamp-1">
              {challenge.title}
          </h3>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed mb-8">
              {challenge.description}
          </p>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-6">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deadline</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
                       <Clock size={14} className={daysLeft < 3 && isActive ? "text-red-500" : "text-slate-400"} />
                       <span>{isActive ? `${daysLeft}d left` : 'Ended'}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teams</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
                       <Users size={14} className="text-slate-400" />
                       <span>{challenge.submissions?.length || 0}</span>
                    </div>
                 </div>
              </div>
              
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 transition-all duration-300">
                 <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

