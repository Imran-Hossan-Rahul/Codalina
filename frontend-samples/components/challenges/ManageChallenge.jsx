"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/ToastProvider";
import { 
  ArrowLeft, ArrowRight, LayoutDashboard, Scale, CheckCircle2, ChevronRight, ChevronLeft,
  ExternalLink, Github, Loader2, Trophy, Users, AlertCircle,
  List, BarChart2, Settings, X, Search, Filter, Play, Check, Minus, MessageSquare, Radio, Crown, Zap, ShieldCheck, Send, Info, Star, Clock, Download
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CraftsmanHoverCard from '../cards/CraftsmanHoverCard';

export default function ManageChallenge({ challengeId }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue"); 
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedWinners, setSelectedWinners] = useState([]);
  const [updateContent, setUpdateContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/challenges/${challengeId}`);
      if (res.success) {
        setChallenge(res.data);
      }
    } catch (error) {
      showToast("Failed to load challenge details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateContent.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/challenges/${challengeId}/updates`, { content: updateContent });
      if (res.success) {
        setChallenge({ ...challenge, updates: res.data });
        setUpdateContent("");
        showToast("Transmission sent successfully", "success");
      }
    } catch (error) {
      showToast("Failed to send update", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWinner = (submission, rank) => {
    const exists = selectedWinners.find(w => w.rank === rank);
    if (exists && exists.user === (submission.user._id || submission.user)) {
        setSelectedWinners(selectedWinners.filter(w => w.rank !== rank));
    } else {
        const filtered = selectedWinners.filter(w => w.rank !== rank);
        setSelectedWinners([...filtered, { 
            rank, 
            user: (submission.user._id || submission.user), 
            submissionId: submission._id,
            userName: submission.user?.name || "Participant"
        }]);

    }
  };

  const handleSaveWinners = async () => {
    if (selectedWinners.length === 0) {
        showToast("Please select at least one winner", "error");
        return;
    }
    try {
      setSubmitting(true);
      const res = await api.post(`/challenges/${challengeId}/winners`, { winners: selectedWinners });
      if (res.success) {
        setChallenge(res.data);
        showToast("Winners finalized. Payouts are pending admin review.", "success");
      }
    } catch (error) {
      showToast(error.message || "Failed to finalize winners", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setSavingStatus(true);
      const res = await api.patch(`/challenges/${challengeId}/status`, { status: newStatus });
      if (res.success) {
        setChallenge(res.data);
        showToast(`Phase advanced to "${newStatus}"`, "success");
      }
    } catch (error) {
      showToast(error.message || "Failed to update phase", "error");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleUpdatePhases = async (phases) => {
    try {
      setSavingStatus(true);
      const res = await api.patch(`/challenges/${challengeId}/phases`, { phases });
      if (res.success) {
        setChallenge(res.data);
        showToast('Phase schedule saved successfully.', 'success');
      }
    } catch (error) {
      showToast(error.message || 'Failed to save phase schedule', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const navItems = [
    { id: "queue", label: "Judging Queue", icon: <List size={16} /> },
    { id: "podium", label: "Prize Podium", icon: <Trophy size={16} /> },
    { id: "broadcast", label: "Broadcast", icon: <Radio size={16} /> },
    { id: "analytics", label: "Operational Logs", icon: <BarChart2 size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={24} className="animate-spin text-slate-900 dark:text-white" />
        <p className="text-xs font-bold text-slate-400 ">Loading workspace...</p>
      </div>
    );
  }

  if (!challenge) return <div className="p-20 text-center text-slate-400 font-medium">Challenge not found.</div>;

  return (
    <>
      {selectedSubmission ? (
         <SubmissionReview 
            submission={selectedSubmission} 
            challenge={challenge}
            selectedWinners={selectedWinners}
            onSelectWinner={handleSelectWinner}
            onBack={() => setSelectedSubmission(null)}
         />
      ) : (
         <div className="w-full flex gap-[35px] pt-8 pb-20 items-start pl-4 md:pl-[17px] pr-4 md:pr-[6px]">
      
      {/* Main Content Area (Middle) */}
      <div className="flex-1 flex flex-col min-w-0 space-y-8">
        
        {/* Header / Top Navigation */}
        <div className="space-y-4">
           <Link href={`/challenges/${challengeId}`} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
             <ChevronLeft size={16} /> Back to Challenges
           </Link>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">{challenge.title}</h1>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4 overflow-x-auto no-scrollbar">
           {navItems.map(item => (
              <button 
                 key={item.id}
                 onClick={() => {
                   if (selectedSubmission) setSelectedSubmission(null);
                   setActiveTab(item.id);
                 }}
                 className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === item.id && !selectedSubmission ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/5' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                 <span className={`${activeTab === item.id && !selectedSubmission ? 'opacity-100' : 'opacity-40'}`}>{item.icon}</span>
                 {item.label}
              </button>
           ))}
        </div>

        {/* Dynamic Content */}
        <main className="relative min-h-[500px]">
           <AnimatePresence mode="wait">
              {activeTab === "queue" ? (
                 <JudgingQueue 
                    key="queue"
                    challenge={challenge} 
                    onSelect={setSelectedSubmission} 
                 />
              ) : activeTab === "podium" ? (
                 <PrizePodium 
                    key="podium" 
                    challenge={challenge} 
                    selectedWinners={selectedWinners}
                    onSaveWinners={handleSaveWinners}
                    submitting={submitting}
                 />
              ) : activeTab === "broadcast" ? (
                 <Broadcast 
                    key="broadcast" 
                    challenge={challenge}
                    updateContent={updateContent}
                    setUpdateContent={setUpdateContent}
                    onPostUpdate={handlePostUpdate}
                    submitting={submitting}
                 />
              ) : activeTab === "analytics" ? (
                 <OperationalLogs key="logs" challenge={challenge} />
              ) : activeTab === "settings" ? (
                 <ChallengeSettings
                     key="settings"
                     challenge={challenge}
                     onUpdateStatus={handleUpdateStatus}
                     onUpdatePhases={handleUpdatePhases}
                     savingStatus={savingStatus}
                  />
              ) : null}
           </AnimatePresence>
        </main>
      </div>

      {/* Right Sidebar Area */}
      <div className="hidden xl:block w-[320px] flex-shrink-0">
        <div className="sticky top-24 space-y-6 pb-20">
           <ManageRightSidebar challenge={challenge} onUpdateStatus={handleUpdateStatus} savingStatus={savingStatus} />
        </div>
      </div>

    </div>
      )}
    </>
  );
}
function JudgingQueue({ challenge, onSelect }) {
   const submissions = challenge.submissions || [];
   
   return (
      <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="space-y-8">
         <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter ">Intelligence Queue</h2>

               </div>
               <div className="flex items-center gap-3">
                  <div className="relative group">
                     <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                     <input type="text" placeholder="Filter identities..." className="pl-11 pr-5 py-3 bg-slate-50/50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5 rounded-2xl text-sm font-bold  text-slate-900 dark:text-white placeholder:text-slate-300 outline-none focus:bg-white dark:focus:bg-white/5 focus:border-slate-400 dark:focus:border-white/20 w-72 transition-all shadow-sm" />
                  </div>
                  <button className="p-3 border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 rounded-2xl text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-white dark:hover:bg-white/5">
                     <Filter size={16} />
                  </button>
               </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-slate-100 dark:border-white/5">
                        <th className="py-6 px-8 text-xs font-semibold text-slate-900 dark:text-white/60 ">Identity</th>
                        <th className="py-6 px-8 text-xs font-semibold text-slate-900 dark:text-white/60 ">Artifact</th>
                        <th className="py-6 px-8 text-xs font-semibold text-slate-900 dark:text-white/60 ">Protocol</th>
                        <th className="py-6 px-8 text-xs font-semibold text-slate-900 dark:text-white/60  text-right">Intel Score</th>
                        <th className="py-6 px-8 text-xs font-semibold text-slate-900 dark:text-white/60  text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/2">
                     {submissions.map(sub => {
                        const hasEvaluated = sub.evaluationScores?.length > 0;
                        const avgScore = hasEvaluated ? (sub.evaluationScores.reduce((acc, curr) => acc + curr.totalScore, 0) / sub.evaluationScores.length).toFixed(1) : '-';
                        return (
                           <tr key={sub._id} className="group hover:bg-slate-50/50 dark:hover:bg-white/2 transition-all">
                              <td className="py-7 px-8">
                                 <CraftsmanHoverCard
                                    userId={sub.user?._id || sub.user}
                                    username={sub.user?.username}
                                    avatarUrl={sub.user?.profilePicture}
                                    displayName={sub.user?.name}
                                 >
                                    <div className="flex items-center gap-4 cursor-pointer">
                                       <img src={sub.user?.profilePicture || 'https://i.ibb.co/L9L7PzY/user.png'} className="w-10 h-10 rounded-2xl border border-slate-100 dark:border-white/5 object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                       <span className="text-xs font-semibold text-slate-900 dark:text-white  tracking-tight">{sub.user?.name}</span>
                                    </div>
                                 </CraftsmanHoverCard>
                              </td>
                              <td className="py-7 px-8">
                                 <p className="text-xs text-slate-500 dark:text-slate-400 font-bold truncate max-w-[200px]  tracking-tight">{sub.title || sub.tagline || 'Untitled'}</p>
                              </td>
                              <td className="py-7 px-8">
                                 {hasEvaluated ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/10 ">
                                       <CheckCircle2 size={10} /> Authorized
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-white/20 text-xs font-semibold border border-slate-100 dark:border-white/5 ">
                                       <Clock size={10} /> Queued
                                    </span>
                                 )}
                              </td>
                              <td className="py-7 px-8 text-right">
                                 <span className={`text-xs font-semibold tracking-widest ${hasEvaluated ? 'text-slate-900 dark:text-white' : 'text-slate-200 dark:text-white/5'}`}>{avgScore}</span>
                              </td>
                              <td className="py-7 px-8 text-right">
                                 <button 
                                    onClick={() => onSelect(sub)}
                                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-sm"
                                 >
                                    Review
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                     {submissions.length === 0 && (
                        <tr>
                           <td colSpan="5" className="py-32 text-center">
                              <p className="text-sm font-semibold text-slate-300 font-medium">No artifacts discovered in queue</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </motion.div>
   );
}

function SubmissionReview({ submission, challenge, selectedWinners, onSelectWinner, onBack }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const distribution = challenge.rewardDistribution || [];
  const sortedDistribution = [...distribution].sort((a, b) => a.rank - b.rank);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!selectedImage) {
        setZoomScale(1);
        setPanPos({ x: 0, y: 0 });
    }
  }, [selectedImage]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (selectedImage) {
        e.preventDefault();
        setZoomScale(prev => {
          const delta = e.deltaY * -0.005;
          return Math.min(Math.max(0.5, prev + delta), 10);
        });
      }
    };
    if (selectedImage) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [selectedImage]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
  };
  
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPanPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <>
    <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} className="w-full flex gap-[35px] pt-8 pb-20 items-start pl-4 md:pl-[17px] pr-4 md:pr-[6px]">
      
      {/* Middle Column */}
      <div className="flex-1 flex flex-col min-w-0 space-y-5">
         
         {/* Header */}
         <div>
            <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ChevronLeft size={16} /> Back to Intelligence Queue
            </button>
         </div>

         {/* Title and User Header */}
         <div className="flex items-center gap-5 p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
             <CraftsmanHoverCard
                userId={submission.user?._id || submission.user}
                username={submission.user?.username}
                avatarUrl={submission.user?.profilePicture}
                displayName={submission.user?.name}
             >
                <img src={submission.user?.profilePicture || 'https://i.ibb.co/L9L7PzY/user.png'} className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-white/10 object-cover grayscale hover:grayscale-0 transition-all duration-500 shadow-sm shrink-0 cursor-pointer" />
             </CraftsmanHoverCard>
             <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{submission.title || submission.tagline || 'Untitled Artifact'}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 truncate">
                   Submitted by 
                   <CraftsmanHoverCard
                      userId={submission.user?._id || submission.user}
                      username={submission.user?.username}
                      avatarUrl={submission.user?.profilePicture}
                      displayName={submission.user?.name}
                      wrapperDisplay="inline"
                   >
                      <span className="text-slate-900 dark:text-white font-semibold cursor-pointer hover:text-slate-600 transition-colors ml-1">{submission.user?.name}</span>
                   </CraftsmanHoverCard>
                   Ã¢â‚¬Â¢ {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
             </div>
         </div>

         {/* Visual Documentation */}
         {submission.screenshots?.length > 0 && (
             <div className="space-y-6">
                <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Visual Documentation</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {submission.screenshots.map((src, i) => (
                      <button key={i} onClick={() => setSelectedImage(src)} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-video block group relative shadow-sm cursor-zoom-in">
                         <img src={src} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                         <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </button>
                   ))}
                </div>
             </div>
         )}

         {/* Devlog Dossier */}
         <div className="space-y-6">
             <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Devlog Dossier</p>
             <div className="prose prose-slate dark:prose-invert max-w-none">
                 <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed whitespace-pre-wrap break-words font-medium border-l-2 border-slate-200 dark:border-white/10 pl-6">{submission.description || submission.fullBrief || "No documentation provided."}</p>
             </div>
         </div>

      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-[320px] flex-shrink-0">
         <div className="sticky top-24 space-y-6 pb-20">
            
            {/* External Assets (Moved to Sidebar) */}
            {submission.resources?.length > 0 && (
               <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">External Assets</p>
                  <div className="space-y-3">
                     {submission.resources.map((res, i) => {
                        const isImage = res.url?.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)($|\?)/i);
                        const Component = isImage ? 'button' : 'a';
                        const props = isImage 
                           ? { onClick: () => setSelectedImage(res.url), className: "w-full text-left flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-all border border-slate-200/50 dark:border-white/5 cursor-zoom-in" }
                           : { href: res.url, target: "_blank", className: "flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-all border border-slate-200/50 dark:border-white/5" };
                           
                        return (
                           <Component key={i} {...props}>
                              <span className="flex items-center gap-2.5 min-w-0 flex-1">
                                 <span className="shrink-0 text-slate-400">
                                    {res.type === 'github' ? <Github size={16}/> : res.type === 'video' ? <Play size={16}/> : res.type === 'file' ? <Download size={16}/> : <ExternalLink size={16}/>}
                                 </span>
                                 <span className="truncate">{res.title || res.altText || 'Asset'}</span>
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold ml-2 shrink-0">{res.type}</span>
                           </Component>
                        );
                     })}
                  </div>
               </div>
            )}



            {/* Tech Stack */}
            {submission.techStack?.length > 0 && (
               <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                     {submission.techStack.map((tech, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5">
                           {tech}
                        </span>
                     ))}
                  </div>
               </div>
            )}

            {/* Final Verdict */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Verdict</p>
               </div>
               
               <div className="space-y-3">
                  {sortedDistribution.map(dist => {
                      const isSelected = selectedWinners.find(w => w.rank === dist.rank && w.user === (submission.user?._id || submission.user));
                      const isTakenByOther = selectedWinners.find(w => w.rank === dist.rank && w.user !== (submission.user?._id || submission.user));
                      const isPayoutDistributed = challenge.payoutStatus === 'distributed';
                      
                      return (
                         <button 
                           key={dist.rank}
                           onClick={() => {
                              if (!isTakenByOther && !isPayoutDistributed) onSelectWinner(submission, dist.rank);
                           }}
                           disabled={isTakenByOther || isPayoutDistributed}
                           className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                              isSelected 
                              ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white shadow-md' 
                              : isTakenByOther || isPayoutDistributed
                                 ? 'bg-slate-50 dark:bg-white/2 border-slate-100 dark:border-white/2 opacity-40 cursor-not-allowed' 
                                 : 'bg-white dark:bg-black border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${isSelected ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                                  {dist.rank}
                               </div>
                               <div className="text-left">
                                  <p className={`text-sm font-bold ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>Rank #{dist.rank}</p>
                                  <p className={`text-xs font-medium mt-0.5 ${isSelected ? 'text-white/70 dark:text-slate-500' : 'text-slate-400'}`}>{dist.amount.toLocaleString()} Tokens</p>
                               </div>
                            </div>
                            {isSelected && <Check size={16} className={isSelected ? 'text-white dark:text-slate-900' : ''} />}
                         </button>
                      )
                   })}
               </div>
               
               <button onClick={onBack} className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-md">
                  Save & Return <ArrowRight size={14} />
               </button>
            </div>
         </div>
      </div>
    </motion.div>
      {/* IMAGE PREVIEW MODAL - Portaled to body for z-index dominance */}
      {isMounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedImage && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 overflow-hidden">
              <motion.div 
                key="preview-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedImage(null)}
                className="absolute inset-0 bg-slate-900/98 backdrop-blur-2xl" 
              />
              
              <motion.div 
                key="preview-content"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none"
              >
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[10001] pointer-events-auto p-2"
                >
                  <X size={32} />
                </button>
                
                <div 
                  className="relative cursor-grab active:cursor-grabbing pointer-events-auto will-change-transform"
                  style={{
                    transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  <img 
                      src={selectedImage} 
                      alt="Visual Proof Preview" 
                      className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none pointer-events-none"
                  />
                </div>
                
                <p className="absolute bottom-10 text-white/40 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
                    Scroll to Zoom \u2022 Drag to Pan \u2022 Click backdrop to close
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function PrizePodium({ challenge, selectedWinners, onSaveWinners, submitting }) {
   const distribution = challenge.rewardDistribution || [];
   const sortedDistribution = [...distribution].sort((a, b) => a.rank - b.rank);

   return (
      <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="rounded-2xl p-8 md:p-12 border border-slate-100 dark:border-white/5">
         <div className="space-y-12">
            <div className="space-y-2">
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight ">Prize Podium</h2>
               <p className="text-sm font-medium text-slate-400">Finalize winners and authorize the release of token payouts.</p>
            </div>
            
            <div className="space-y-4">
                {sortedDistribution.map(dist => {
                  const selectedWinner = selectedWinners.find(w => w.rank === dist.rank);
                  const winnerId = selectedWinner?.user || challenge.winners?.find(w => w.rank === dist.rank)?.user?._id;
                  
                  // Try to find the name in multiple places: state, participants, or submissions
                  let userName = selectedWinner?.userName;
                  if (!userName && winnerId) {
                     const participant = challenge.participants?.find(p => (p.user?._id || p.user) === winnerId);
                     userName = participant?.user?.name;
                     
                     if (!userName) {
                        const submission = challenge.submissions?.find(s => (s.user?._id || s.user) === winnerId);
                        userName = submission?.user?.name;
                     }
                  }
                  
                  if (!userName) userName = "Unassigned";

                 return (
                   <div key={dist.rank} className={`flex items-center gap-8 p-8 rounded-2xl border transition-all ${winnerId ? 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 shadow-sm' : 'bg-transparent border-slate-200 dark:border-white/10 border-dashed opacity-60'}`}>
                      <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center font-semibold text-xl shadow-xl ${
                        dist.rank === 1 
                          ? 'bg-amber-400 text-amber-950 shadow-amber-500/20' 
                          : dist.rank === 2 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-slate-500/10' 
                            : dist.rank === 3 
                              ? 'bg-orange-500 text-white shadow-orange-500/20' 
                              : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                      }`}>
                         {dist.rank === 1 ? <Crown size={28} /> : dist.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className={`text-lg font-bold truncate ${winnerId ? 'text-slate-900 dark:text-white' : 'text-slate-400  text-xs'}`}>{userName}</p>
                         <p className="text-sm font-semibold text-slate-400  mt-1">{dist.amount.toLocaleString()} Tokens Allocation</p>
                      </div>
                   </div>
                 );
               })}
            </div>

            {challenge.payoutStatus !== 'distributed' ? (
              <div className="space-y-6 pt-12 border-t border-slate-100 dark:border-white/5">
                 <button 
                   onClick={onSaveWinners}
                   disabled={submitting || selectedWinners.length < sortedDistribution.length}
                   className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 dark:shadow-white/10"
                 >
                   {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Execute Finalization & Payout Protocols <ChevronRight size={16} /></>}
                 </button>
                 {selectedWinners.length < sortedDistribution.length && (
                     <div className="flex gap-3 px-6 py-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
                        <AlertCircle size={16} className="text-yellow-500/80 shrink-0" />
                        <p className="text-sm text-yellow-500/80 font-medium">
                           Selection Incomplete: You must assign all ranks to finalize the challenge.
                        </p>
                     </div>
                 )}
              </div>
            ) : (
              <div className="space-y-6 pt-6 border-t border-zinc-800/50">
                 <div className={`w-full py-4 rounded-xl text-sm font-semibold text-center border bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>
                     Mission Successful - Payouts Distributed
                 </div>
              </div>
            )}
         </div>
      </motion.div>
   );
}
function Broadcast({ challenge, updateContent, setUpdateContent, onPostUpdate, submitting }) {
   return (
      <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="rounded-2xl p-8 md:p-12 border border-slate-100 dark:border-white/5">
         <div className="space-y-8">
            <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight ">Signal Dispatch</h2>
               <p className="text-sm font-medium text-slate-400 mt-1">Broadcast an encrypted update to all active challenge participants.</p>
            </div>
            
            <div className="relative group">
               <textarea 
                 value={updateContent}
                 onChange={(e) => setUpdateContent(e.target.value)}
                 placeholder="Draft your announcement payload..."
                 className="w-full h-64 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-900/50 focus:ring-4 focus:ring-slate-900/5 resize-none transition-all shadow-sm"
               />
               <button 
                 onClick={onPostUpdate}
                 disabled={submitting || !updateContent.trim()}
                 className="absolute right-6 bottom-6 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-medium hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/10 flex items-center gap-2"
               >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <>Execute Dispatch <Send size={14} /></>}
               </button>
            </div>
         </div>
      </motion.div>
   );
}

function OperationalLogs({ challenge }) {
   return (
      <motion.div initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} className="rounded-2xl p-8 md:p-12 border border-slate-100 dark:border-white/5">
         <div className="space-y-8">
            <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight ">Operational Logs</h2>
               <p className="text-sm font-medium text-slate-400 mt-1">Immutable history of all system broadcasts and operational updates.</p>
            </div>
            
            <div className="space-y-4">
               {challenge.updates?.length > 0 ? [...challenge.updates].reverse().map((update, idx) => (
                 <div key={idx} className="flex gap-6 p-8 bg-white dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-[24px] hover:border-slate-900/30 transition-all group shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                       <Radio size={18} className="text-slate-900" />
                    </div>
                    <div className="space-y-3">
                       <p className="text-sm font-semibold text-slate-400 ">
                          {new Date(update.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </p>
                       <p className="text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{update.content}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-24 text-center border-2 border-slate-100 dark:border-white/5 border-dashed rounded-2xl bg-slate-50/50 dark:bg-white/2">
                    <Info size={32} className="mx-auto text-slate-300 dark:text-zinc-700 mb-4" />
                    <p className="text-sm font-bold text-slate-400 ">No operational logs recorded.</p>
                 </div>
               )}
            </div>
         </div>
      </motion.div>
   );
}

function ChallengeSettings({ challenge, onUpdateStatus, onUpdatePhases, savingStatus }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [phaseDates, setPhaseDates] = useState({
    registrationStart: challenge.phases?.registrationStart ? new Date(challenge.phases.registrationStart).toISOString().slice(0,16) : '',
    registrationEnd:   challenge.phases?.registrationEnd   ? new Date(challenge.phases.registrationEnd).toISOString().slice(0,16)   : '',
    submissionStart:   challenge.phases?.submissionStart   ? new Date(challenge.phases.submissionStart).toISOString().slice(0,16)   : '',
    submissionEnd:     challenge.phases?.submissionEnd     ? new Date(challenge.phases.submissionEnd).toISOString().slice(0,16)     : '',
    judgingStart:      challenge.phases?.judgingStart      ? new Date(challenge.phases.judgingStart).toISOString().slice(0,16)      : '',
    judgingEnd:        challenge.phases?.judgingEnd        ? new Date(challenge.phases.judgingEnd).toISOString().slice(0,16)        : '',
    winnerAnnouncement:challenge.phases?.winnerAnnouncement? new Date(challenge.phases.winnerAnnouncement).toISOString().slice(0,16): '',
  });
  const [savingPhases, setSavingPhases] = useState(false);

  // Allowed transitions per phase - mirrors PHASE_ENGINE.TRANSITIONS in backend
  const ALLOWED_TRANSITIONS = {
    draft:             ['upcoming', 'registration_open'],
    upcoming:          ['registration_open'],
    registration_open: ['submissions_open', 'in_review'],
    submissions_open:  ['in_review', 'completed'],
    in_review:         ['completed'],
    completed:         [],
    cancelled:         [],
    active:            ['in_review', 'completed'],
    published:         ['registration_open', 'submissions_open'],
  };

  const ALL_PHASES = [
    { value: 'draft',              label: 'Draft',               desc: 'Hidden - not visible to participants',                color: 'slate'   },
    { value: 'upcoming',           label: 'Upcoming',            desc: 'Visible but registration not yet open',               color: 'blue'    },
    { value: 'registration_open',  label: 'Registration Open',   desc: 'Participants can join the challenge',                 color: 'indigo'  },
    { value: 'submissions_open',   label: 'Submissions Open',    desc: 'Registered participants can submit artifacts',        color: 'violet'  },
    { value: 'in_review',          label: 'In Review',           desc: 'Submission window closed - judges are evaluating',    color: 'amber'   },
    { value: 'completed',          label: 'Completed',           desc: 'Challenge concluded - winners finalized',             color: 'emerald' },
  ];

  const colorMap = {
    slate:   { pill: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10', dot: 'bg-slate-400' },
    blue:    { pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',     dot: 'bg-blue-500'    },
    indigo:  { pill: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' },
    violet:  { pill: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20', dot: 'bg-violet-500' },
    amber:   { pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',  dot: 'bg-amber-500'   },
    emerald: { pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    red:     { pill: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',         dot: 'bg-red-500'     },
  };

  const currentIdx = ALL_PHASES.findIndex(p => p.value === challenge.status);
  const allowedNext = ALLOWED_TRANSITIONS[challenge.status] || [];
  const isTerminal = ['completed', 'cancelled'].includes(challenge.status);

  const handleSavePhases = async () => {
    setSavingPhases(true);
    const payload = {};
    Object.entries(phaseDates).forEach(([k, v]) => { if (v) payload[k] = new Date(v).toISOString(); });
    await onUpdatePhases(payload);
    setSavingPhases(false);
  };

  const dateFields = [
    { key: 'registrationStart', label: 'Registration Start' },
    { key: 'registrationEnd',   label: 'Registration End'   },
    { key: 'submissionStart',   label: 'Submission Start'   },
    { key: 'submissionEnd',     label: 'Submission End'     },
    { key: 'judgingStart',      label: 'Judging Start'      },
    { key: 'judgingEnd',        label: 'Judging End'        },
    { key: 'winnerAnnouncement',label: 'Winner Announcement'},
  ];

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl p-8 md:p-12 border border-slate-100 dark:border-white/5"
    >
      <div className="space-y-12">

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Module Configuration</h2>
          <p className="text-sm font-medium text-slate-400">Manage the lifecycle phases and schedule of this challenge.</p>
        </div>

        {/* Phase Timeline */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Phase Lifecycle</p>
          <div className="relative">
            <div className="flex items-center gap-0">
              {ALL_PHASES.map((phase, idx) => {
                const isPast    = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isFuture  = idx > currentIdx;
                const col = colorMap[phase.color];
                return (
                  <div key={phase.value} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                        isCurrent ? `${col.dot} border-transparent scale-125 shadow-lg` :
                        isPast    ? 'bg-slate-300 dark:bg-white/30 border-transparent' :
                                    'bg-transparent border-slate-200 dark:border-white/10'
                      }`} />
                      <p className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight max-w-[52px] ${
                        isCurrent ? 'text-slate-900 dark:text-white' :
                        isPast    ? 'text-slate-400'                  : 'text-slate-300 dark:text-white/20'
                      }`}>{phase.label}</p>
                    </div>
                    {idx < ALL_PHASES.length - 1 && (
                      <div className={`flex-1 h-px mx-1 ${isPast || isCurrent ? 'bg-slate-300 dark:bg-white/20' : 'bg-slate-100 dark:bg-white/5'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Phase Transition - only shows allowed next moves */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Advance Phase</p>
            <p className="text-xs font-medium text-slate-400 mt-1">
              {isTerminal
                ? 'This challenge has reached a terminal state and cannot be advanced further.'
                : `From "${ALL_PHASES.find(p=>p.value===challenge.status)?.label || challenge.status}", you may advance to:`}
            </p>
          </div>
          {isTerminal ? (
            <div className={`p-5 rounded-2xl border ${colorMap[ALL_PHASES.find(p=>p.value===challenge.status)?.color || 'slate'].pill} flex items-center gap-3`}>
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Challenge is in a terminal state - no further phase changes allowed.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {allowedNext.filter(v => v !== 'cancelled').map(nextVal => {
                const opt = ALL_PHASES.find(p => p.value === nextVal);
                if (!opt) return null;
                const col = colorMap[opt.color];
                return (
                  <button
                    key={nextVal}
                    onClick={() => onUpdateStatus(nextVal)}
                    disabled={savingStatus}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/2 hover:border-slate-900/50 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dot} shrink-0`} />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-tight">{opt.label}</p>
                        <p className="text-xs font-medium text-slate-400">{opt.desc}</p>
                      </div>
                    </div>
                    {savingStatus
                      ? <Loader2 size={14} className="animate-spin text-slate-400 shrink-0" />
                      : <ArrowRight size={14} className="text-slate-300 shrink-0" />
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Phase Date Editor */}
        {!isTerminal && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Phase Schedule</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Set or update the date boundaries for each phase. These are enforced server-side.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dateFields.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{label}</label>
                  <input
                    type="datetime-local"
                    value={phaseDates[key]}
                    onChange={e => setPhaseDates(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/3 text-sm font-medium text-slate-800 dark:text-zinc-100 outline-none focus:border-slate-900 dark:focus:border-white/30 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10 transition-all"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSavePhases}
              disabled={savingPhases || savingStatus}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              {savingPhases ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save Phase Schedule
            </button>
          </div>
        )}

        {/* Operational Summary */}
        <div className="p-8 rounded-2xl bg-slate-50/50 dark:bg-white/2 border border-slate-200 dark:border-white/5 space-y-8">
          <p className="text-sm font-semibold text-slate-400">Operational Summary</p>
          <div className="grid grid-cols-2 gap-y-8 gap-x-12">
            {[
              { label: 'Participants', value: challenge.participants?.length || 0 },
              { label: 'Artifacts', value: challenge.submissions?.length || 0 },
              { label: 'Grand Prize', value: `${(challenge.prizePool || 0).toLocaleString()} Tokens` },
              { label: 'Authorized Judges', value: challenge.judges?.length || 0 },
              { label: 'Payout State', value: challenge.payoutStatus || 'Awaiting Finalization' },
              { label: 'Podium Ranks', value: challenge.rewardDistribution?.length || 0 },
            ].map(item => (
              <div key={item.label} className="space-y-1.5 border-l-2 border-slate-200 dark:border-white/10 pl-4">
                <p className="text-xs font-semibold text-slate-400">{item.label}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        {!isTerminal && (
          <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-500" />
              </div>
              <h4 className="text-sm font-bold text-red-600 dark:text-red-400 tracking-tight">Danger Zone</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed ml-1">
              Aborting a challenge is irreversible. All participants will lose access immediately.
            </p>
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} className="w-full py-4 rounded-2xl border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all">
                Abort Challenge Permanently
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => { onUpdateStatus('cancelled'); setConfirmCancel(false); }}
                  disabled={savingStatus}
                  className="w-full sm:flex-1 py-4 rounded-2xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {savingStatus ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirm Abortion
                </button>
                <button onClick={() => setConfirmCancel(false)} className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  Maintain Mission
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
}

function ManageRightSidebar({ challenge, onUpdateStatus, savingStatus }) {
  const statusOptions = [
    { value: 'draft',              label: 'Draft',               color: 'slate',   icon: <Settings size={14} /> },
    { value: 'upcoming',           label: 'Upcoming',            color: 'blue',    icon: <Clock size={14} /> },
    { value: 'registration_open',  label: 'Registration',        color: 'slate',  icon: <Users size={14} /> },
    { value: 'submissions_open',   label: 'Submissions',         color: 'slate',  icon: <LayoutDashboard size={14} /> },
    { value: 'in_review',          label: 'In Review',           color: 'amber',   icon: <Search size={14} /> },
    { value: 'completed',          label: 'Completed',           color: 'emerald', icon: <CheckCircle2 size={14} /> },
    { value: 'cancelled',          label: 'Cancelled',           color: 'red',     icon: <X size={14} /> },
  ];

  const colorMap = {
    slate: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-white/10',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const currentStatus = statusOptions.find(s => s.value === challenge.status) || statusOptions[0];

  return (
    <aside className="space-y-6">
      {/* Current Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
          <ShieldCheck size={14} className="text-slate-900 dark:text-white" /> System Protocol
        </h3>
        
        <div className="space-y-6">
          <div className={`p-4 rounded-2xl flex items-center gap-4 border ${colorMap[currentStatus.color]}`}>
            <div className="shrink-0">{currentStatus.icon}</div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold  opacity-60">Phase</p>
               <p className="text-sm font-semibold  tracking-tight">{currentStatus.label}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Live Metrics</p>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{challenge.participants?.length || 0}</p>
                 <p className="text-xs font-bold text-slate-400 ">Operatives</p>
               </div>
               <div className="space-y-1">
                 <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{challenge.submissions?.length || 0}</p>
                 <p className="text-xs font-bold text-slate-400 ">Artifacts</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Pool Card */}
      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/10 dark:bg-slate-900/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-slate-100/20 transition-all duration-700" />
        <div className="relative z-10">
           <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500  mb-4 flex items-center gap-2">
             <Trophy size={14} /> Total Bounty
           </h3>
           <p className="text-2xl font-bold leading-none mb-2">{(challenge.prizePool || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ">TKNS</span></p>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Distributed across {challenge.rewardDistribution?.length || 0} ranks</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Command Actions</h3>
        <div className="space-y-2">
           <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors group">
              <span className="text-sm font-bold  tracking-wider group-hover:text-slate-900 dark:group-hover:text-white">Export Roster</span>
              <Download size={14} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
           </button>
           <Link href={`/challenges/${challenge._id}`} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors group">
              <span className="text-sm font-bold  tracking-wider group-hover:text-slate-900 dark:group-hover:text-white">View Public Listing</span>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
           </Link>
        </div>
      </div>
    </aside>
  );
}


