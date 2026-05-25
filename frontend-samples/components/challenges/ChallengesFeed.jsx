"use client";
import React, { useState, useEffect, useContext } from "react";
import { api } from "@/utils/api";
import { ChallengeCard } from "./ChallengeCard";
import { Trophy, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardContext } from "@/app/(dashboard)/layout";

export default function ChallengesFeed() {
  const { isGuest, requireAuth } = useContext(DashboardContext) || {};
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'judging', 'completed'

  const fetchChallenges = async (pageNum, isLoadMore = false) => {
      try {
          if (isLoadMore) setLoadingMore(true);
          else setLoading(true);
          
          const res = await api.get(`/challenges?page=${pageNum}&limit=20`);
          if (res.success) {
              if (res.data.length < 20) setHasMore(false);
              else setHasMore(true);
              
              if (isLoadMore) setChallenges(prev => [...prev, ...res.data]);
              else setChallenges(res.data);
          }
      } catch (e) {
          console.error("Challenges fetch failed", e);
      } finally {
          setLoading(false);
          setLoadingMore(false);
      }
  };

  useEffect(() => {
    fetchChallenges(1, false);
    setPage(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchChallenges(nextPage, true);
  };

  const now = new Date();

  // Filter logic based on phased timelines
  const filteredChallenges = challenges.filter(c => {
    if (filter === "all") return true;
    
    const phases = c.phases || {};
    const subEnd = new Date(phases.submissionEnd || c.endDate);
    const isCompleted = c.status === 'completed';

    if (filter === "completed") return isCompleted;
    if (filter === "judging") return now > subEnd && !isCompleted;
    if (filter === "active") return now <= subEnd && !isCompleted;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen">
        
        {/* Refined Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 border-b border-slate-200 dark:border-white/5 pb-12">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                    <Trophy size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Premium Bounties</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Engineering <br className="hidden md:block"/>
                    <span className="text-slate-400">Excellence.</span>
                </h1>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-8">
               {['all', 'active', 'judging', 'completed'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`relative py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      filter === f 
                      ? 'text-slate-900 dark:text-white' 
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                    }`}
                  >
                     {f}
                     {filter === f && (
                        <motion.div
                           layoutId="activeFeedFilter"
                           className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-slate-900 dark:bg-white rounded-full"
                           transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                     )}
                  </button>
               ))}
            </div>
        </div>

        {/* Feed Grid */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
               <Loader2 className="animate-spin text-indigo-500" size={32} />
               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Grid</p>
            </div>
        ) : filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <AnimatePresence mode="popLayout">
                  {filteredChallenges.map((c, i) => (
                      <motion.div
                          key={c._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                      >
                          <ChallengeCard 
                              challenge={c} 
                              isGuest={isGuest}
                              onRequireAuth={requireAuth}
                          />
                      </motion.div>
                  ))}
               </AnimatePresence>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-[#0a0a0a] rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
               <Trophy size={32} className="text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Challenges Found</h3>
               <p className="text-sm text-slate-500 text-center max-w-md">
                   There are currently no challenges matching this filter. Check back later or adjust your criteria.
               </p>
            </div>
        )}

        {hasMore && !loading && filteredChallenges.length > 0 && (
            <div className="flex justify-center mt-16">
                <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm tracking-widest uppercase hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                    {loadingMore ? <Loader2 className="animate-spin" size={18} /> : "Load More Challenges"}
                </button>
            </div>
        )}

    </div>
  );
}
