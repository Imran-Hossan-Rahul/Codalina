"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/ToastProvider";
import { 
  ArrowLeft, LayoutDashboard, Scale, CheckCircle2, ChevronRight, 
  ExternalLink, Github, Loader2, Trophy, Users, AlertCircle,
  List, BarChart2, Settings, X, Search, Filter, Play, Check, Minus, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CraftsmanHoverCard from "../cards/CraftsmanHoverCard";

export default function JudgingPortal({ challengeId }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("queue"); 
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
        <p className="text-xs font-medium text-zinc-500 tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  if (!challenge) return <div className="p-20 text-center text-zinc-400 bg-zinc-950 min-h-screen">Challenge not found.</div>;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} challengeId={challengeId} challenge={challenge} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header challenge={challenge} />
        
        <main className="flex-1 overflow-hidden relative">
           <AnimatePresence mode="wait">
             {selectedSubmission ? (
                <SubmissionReview 
                   key="review"
                   submission={selectedSubmission} 
                   challenge={challenge}
                   onBack={() => setSelectedSubmission(null)}
                   onSuccess={() => {
                     fetchChallenge();
                     setSelectedSubmission(null);
                   }}
                />
             ) : activeTab === "queue" ? (
                <JudgingQueue 
                   key="queue"
                   challenge={challenge} 
                   onSelect={setSelectedSubmission} 
                />
             ) : activeTab === "leaderboard" ? (
                <Leaderboard key="leaderboard" challenge={challenge} />
             ) : (
                <motion.div key="placeholder" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center justify-center h-full text-zinc-500 text-sm">
                   View under construction.
                </motion.div>
             )}
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, challengeId, challenge }) {
   const navItems = [
      { id: "queue", label: "Judging Queue", icon: <List size={16} /> },
      { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
      { id: "analytics", label: "Analytics", icon: <BarChart2 size={16} /> },
      { id: "settings", label: "Settings", icon: <Settings size={16} /> }
   ];

   return (
      <div className="w-64 border-r border-zinc-800/50 bg-[#0A0A0A] flex flex-col shrink-0 z-20 hidden md:flex">
         <div className="h-16 flex items-center px-6 border-b border-zinc-800/50 shrink-0">
            <Link href={`/challenges/${challengeId}`} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-colors">
               <ArrowLeft size={14} /> Exit Portal
            </Link>
         </div>
         <div className="p-6">
            <p className="text-xs font-semibold text-zinc-500 mb-4 px-2 uppercase tracking-wider">Evaluation System</p>
            <nav className="space-y-1">
               {navItems.map(item => (
                  <button 
                     key={item.id}
                     onClick={() => setActiveTab(item.id)}
                     className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-zinc-800/50 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'}`}
                  >
                     {item.icon} {item.label}
                  </button>
               ))}
            </nav>
         </div>
         <div className="mt-auto p-6 border-t border-zinc-800/50">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Scale size={14} className="text-zinc-400" />
                 </div>
                 <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-300 truncate">{challenge.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">Judging Portal</p>
                 </div>
             </div>
         </div>
      </div>
   );
}

function Header({ challenge }) {
   return (
      <header className="h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
         <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-100 tracking-tight">{challenge.title}</span>
            <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
               {challenge.status}
            </span>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-500 font-medium hidden sm:block">
               {challenge.submissions?.length || 0} Submissions
            </div>
         </div>
      </header>
   );
}

function JudgingQueue({ challenge, onSelect }) {
   const submissions = challenge.submissions || [];
   
   return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 overflow-y-auto no-scrollbar p-8 lg:p-12">
         <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Judging Queue</h2>
                  <p className="text-sm text-zinc-500 mt-1">{submissions.length} submissions awaiting review</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                     <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-700 w-64 transition-colors" />
                  </div>
                  <button className="p-2 border border-zinc-800/50 bg-zinc-900/50 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors">
                     <Filter size={16} />
                  </button>
               </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-zinc-800/50">
                        <th className="py-4 px-6 text-xs font-medium text-zinc-500">Participant</th>
                        <th className="py-4 px-6 text-xs font-medium text-zinc-500">Devlog</th>
                        <th className="py-4 px-6 text-xs font-medium text-zinc-500">Status</th>
                        <th className="py-4 px-6 text-xs font-medium text-zinc-500 text-right">Score</th>
                        <th className="py-4 px-6 text-xs font-medium text-zinc-500 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                     {submissions.map(sub => {
                        const hasEvaluated = sub.evaluationScores?.length > 0;
                        const avgScore = hasEvaluated ? (sub.evaluationScores.reduce((acc, curr) => acc + curr.totalScore, 0) / sub.evaluationScores.length).toFixed(1) : '-';
                        return (
                           <tr key={sub._id} className="group hover:bg-zinc-900/50 transition-colors">
                              <td className="py-4 px-6">
                                 <CraftsmanHoverCard
                                    userId={sub.user?._id || sub.user}
                                    username={sub.user?.username}
                                    avatarUrl={sub.user?.profilePicture}
                                    displayName={sub.user?.name}
                                 >
                                    <div className="flex items-center gap-3 cursor-pointer">
                                       <img src={sub.user?.profilePicture || 'https://i.ibb.co/L9L7PzY/user.png'} className="w-8 h-8 rounded-full border border-zinc-800/50 object-cover" />
                                       <span className="text-sm font-medium text-zinc-200 hover:text-white transition-colors">{sub.user?.name}</span>
                                    </div>
                                 </CraftsmanHoverCard>
                              </td>
                              <td className="py-4 px-6">
                                 <p className="text-sm text-zinc-300 font-medium truncate max-w-[200px]">{sub.title || sub.tagline || 'Untitled'}</p>
                              </td>
                              <td className="py-4 px-6">
                                 {hasEvaluated ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium border border-emerald-500/20">
                                       <Check size={10} /> Reviewed
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-medium border border-zinc-700">
                                       <Minus size={10} /> Pending
                                    </span>
                                 )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                 <span className={`text-sm font-medium ${hasEvaluated ? 'text-zinc-100' : 'text-zinc-600'}`}>{avgScore}</span>
                              </td>
                              <td className="py-4 px-6 text-right">
                                 <button 
                                    onClick={() => onSelect(sub)}
                                    className="opacity-0 group-hover:opacity-100 px-4 py-1.5 bg-white text-black text-xs font-medium rounded-lg transition-all hover:bg-zinc-200"
                                 >
                                    Review
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                     {submissions.length === 0 && (
                        <tr>
                           <td colSpan="5" className="py-12 text-center text-zinc-500 text-sm">
                              No submissions found.
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

function SubmissionReview({ submission, challenge, onBack, onSuccess }) {
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const criteria = challenge.judgingCriteria || [];

  useEffect(() => {
     setScores({});
     setFeedback("");
  }, [submission]);

  const calculateTotal = () => {
    let total = 0;
    criteria.forEach(crit => {
      const score = scores[crit.criterion] || 0;
      total += (score / 10) * crit.weight;
    });
    return total.toFixed(1);
  };

  const handleSubmit = async (actionType) => {
     try {
       setSubmitting(true);
       const payloadScores = Object.entries(scores).map(([criterion, score]) => ({ criterion, score }));
       const payload = {
          scores: payloadScores,
          totalScore: Number(calculateTotal()),
          feedback
       };
       const res = await api.post(`/challenges/${challenge._id}/submissions/${submission._id}/score`, payload);
       if (res.success) {
          showToast("Evaluation recorded.", "success");
          onSuccess();
       }
     } catch (err) {
       showToast(err.message || "Failed to submit.", "error");
     } finally {
       setSubmitting(false);
     }
  };

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute inset-0 flex flex-col md:flex-row overflow-hidden bg-zinc-950">
       <div className="flex-1 border-r border-zinc-800/50 overflow-y-auto no-scrollbar">
          <div className="p-8 md:p-10 max-w-4xl mx-auto space-y-10">
             <div className="space-y-5">
                <button onClick={onBack} className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                   <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Queue
                </button>
                <div className="flex items-start justify-between gap-6 flex-wrap">
                   <div className="space-y-3 flex-1 min-w-0">
                      <CraftsmanHoverCard
                         userId={submission.user?._id || submission.user}
                         username={submission.user?.username}
                         avatarUrl={submission.user?.profilePicture}
                         displayName={submission.user?.name}
                      >
                         <div className="flex items-center gap-3 cursor-pointer">
                            <img src={submission.user?.profilePicture || 'https://i.ibb.co/L9L7PzY/user.png'} className="w-10 h-10 rounded-full border border-zinc-800 object-cover shrink-0" />
                            <div>
                               <p className="text-zinc-100 font-medium hover:text-white transition-colors">{submission.user?.name}</p>
                               <p className="text-zinc-500 text-xs">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                      </CraftsmanHoverCard>
                      <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">{submission.title || submission.tagline || 'Untitled Artifact'}</h1>
                      {submission.tagline && submission.title && <p className="text-zinc-400 text-sm italic">{submission.tagline}</p>}
                      <div className="flex flex-wrap gap-2">
                         {submission.techStack?.map((tech, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">{tech}</span>
                         ))}
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-2 shrink-0">
                      {submission.githubLink && <a href={submission.githubLink} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-800/50"><Github size={15}/> Source</a>}
                      {submission.liveUrl && <a href={submission.liveUrl} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-medium transition-colors"><ExternalLink size={15}/> Live Demo</a>}
                      {submission.accessibleLink && <a href={submission.accessibleLink} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-800/50"><ExternalLink size={14}/> Full Access</a>}
                   </div>
                </div>
             </div>

             {submission.screenshots?.length > 0 && (
                <div className="space-y-3">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Screenshots</p>
                   <div className="grid grid-cols-2 gap-3">
                      {submission.screenshots.map((src, i) => (
                         <a key={i} href={src} target="_blank" className="rounded-xl overflow-hidden border border-zinc-800/50 aspect-video block">
                            <img src={src} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                         </a>
                      ))}
                   </div>
                </div>
             )}

             <div className="space-y-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Devlog Overview</p>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap break-words">{submission.description || submission.fullBrief || "No description provided."}</p>
             </div>

             {submission.fullBrief && submission.description && (
                <div className="space-y-3 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Brief</p>
                   <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap break-words">{submission.fullBrief}</p>
                </div>
             )}

             {submission.challengesFaced && (
                <div className="space-y-3 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Challenges Faced</p>
                   <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap break-words">{submission.challengesFaced}</p>
                </div>
             )}

             {submission.futurePlans && (
                <div className="space-y-3 p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Future Plans</p>
                   <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap break-words">{submission.futurePlans}</p>
                </div>
             )}

             {submission.resources?.length > 0 && (
                <div className="space-y-3">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attached Resources</p>
                   <div className="space-y-2">
                      {submission.resources.map((res, i) => (
                         <a key={i} href={res.url} target={res.type === 'file' ? '_self' : '_blank'} download={res.type === 'file' ? (res.title || true) : undefined} className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 shrink-0">
                               {res.type === 'github' ? <Github size={14}/> : res.type === 'video' ? <Play size={14}/> : res.type === 'file' ? <span className="text-[10px] font-bold">↓</span> : <ExternalLink size={14}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium text-zinc-300 truncate">{res.title || res.altText || res.url}</p>
                               <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{res.type === 'file' ? '⬇ Download' : res.type}</p>
                            </div>
                         </a>
                      ))}
                   </div>
                </div>
             )}

             {submission.teamMembers?.length > 0 && (
                <div className="space-y-3">
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Team Members</p>
                   <div className="flex flex-wrap gap-2">
                      {submission.teamMembers.map((m, i) => (
                         <CraftsmanHoverCard
                            key={i}
                            userId={m?._id || m}
                            username={m?.username}
                            avatarUrl={m?.profilePicture}
                            displayName={m?.name}
                         >
                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
                               <img src={m?.profilePicture || 'https://i.ibb.co/L9L7PzY/user.png'} className="w-6 h-6 rounded-full object-cover border border-zinc-700" />
                               <span className="text-xs text-zinc-300 font-medium">{m?.name || 'Member'}</span>
                            </div>
                         </CraftsmanHoverCard>
                      ))}
                   </div>
                </div>
             )}
          </div>
       </div>

       <div className="w-full md:w-[480px] bg-zinc-950 flex flex-col shrink-0">
          <div className="p-8 border-b border-zinc-800/50 bg-zinc-900/20">
             <div className="flex items-end justify-between">
                <div>
                   <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Total Score</p>
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-semibold text-zinc-100 tracking-tighter">{calculateTotal()}</span>
                      <span className="text-zinc-500 font-medium">/100</span>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
             {criteria.length > 0 ? (
                <div className="space-y-8">
                   {criteria.map((crit, i) => (
                      <div key={i} className="space-y-4">
                         <div className="flex items-start justify-between gap-4">
                            <div>
                               <p className="text-sm font-medium text-zinc-100">{crit.criterion}</p>
                               <p className="text-xs text-zinc-500">{crit.description}</p>
                            </div>
                            <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">{crit.weight}%</span>
                         </div>
                         <div className="relative group">
                            <input 
                              type="range" min="0" max="10" step="0.5"
                              value={scores[crit.criterion] || 0}
                              onChange={(e) => setScores({...scores, [crit.criterion]: Number(e.target.value)})}
                              className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none accent-zinc-300 focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-950"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-medium">
                               <span>0</span>
                               <span className="text-zinc-300 font-semibold">{scores[crit.criterion] || "0"}</span>
                               <span>10</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl flex gap-3 text-yellow-500/80">
                   <AlertCircle size={16} className="shrink-0" />
                   <p className="text-xs">No judging criteria defined.</p>
                </div>
             )}

             <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-100">Private Feedback</p>
                <textarea 
                   value={feedback}
                   onChange={(e) => setFeedback(e.target.value)}
                   placeholder="Add notes for your review..."
                   className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 resize-none transition-all"
                />
             </div>
          </div>

          <div className="p-8 border-t border-zinc-800/50 bg-zinc-900/20 grid grid-cols-2 gap-3">
             <button 
               onClick={() => handleSubmit('reject')}
               disabled={submitting}
               className="px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
             >
                <X size={16} /> Reject
             </button>
             <button 
               onClick={() => handleSubmit('submit')}
               disabled={submitting || criteria.length === 0}
               className="px-4 py-3 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
             >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Submit Score</>}
             </button>
          </div>
       </div>
    </motion.div>
  );
}

function Leaderboard({ challenge }) {
   const rankedSubmissions = [...(challenge.submissions || [])].map(sub => {
       const hasEvaluated = sub.evaluationScores?.length > 0;
       const avgScore = hasEvaluated ? (sub.evaluationScores.reduce((acc, curr) => acc + curr.totalScore, 0) / sub.evaluationScores.length) : 0;
       return { ...sub, avgScore };
   }).sort((a, b) => b.avgScore - a.avgScore);

   return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 overflow-y-auto no-scrollbar p-8 lg:p-12">
         <div className="max-w-4xl mx-auto space-y-8">
            <div>
               <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Leaderboard</h2>
               <p className="text-sm text-zinc-500 mt-1">Real-time ranking based on aggregated judge scores.</p>
            </div>
            
            <div className="space-y-3">
               {rankedSubmissions.map((sub, idx) => (
                  <div key={sub._id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700 transition-colors">
                     <div className="flex items-center gap-6">
                        <span className="text-zinc-500 font-medium w-6 text-right">#{idx + 1}</span>
                        <CraftsmanHoverCard
                           userId={sub.user?._id || sub.user}
                           username={sub.user?.username}
                           avatarUrl={sub.user?.profilePicture}
                           displayName={sub.user?.name}
                        >
                           <div className="flex items-center gap-3 cursor-pointer">
                              <img src={sub.user?.profilePicture || 'https://i.ibb.co/L9L7PzY/user.png'} className="w-10 h-10 rounded-full border border-zinc-800/50 object-cover" />
                              <div>
                                 <p className="text-sm font-medium text-zinc-100">{sub.title || sub.tagline || 'Untitled'}</p>
                                 <p className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">{sub.user?.name}</p>
                              </div>
                           </div>
                        </CraftsmanHoverCard>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right">
                           <p className="text-xl font-semibold text-zinc-100 tracking-tighter">{sub.avgScore.toFixed(1)}</p>
                           <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Points</p>
                        </div>
                     </div>
                  </div>
               ))}
               {rankedSubmissions.length === 0 && (
                   <div className="text-center py-12 text-zinc-500 text-sm">No evaluated submissions yet.</div>
               )}
            </div>
         </div>
      </motion.div>
   );
}


