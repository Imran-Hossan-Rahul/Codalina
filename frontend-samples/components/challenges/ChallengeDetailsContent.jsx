"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Trophy, Calendar, Code, Layout as LayoutIcon, ArrowRight, CheckCircle2, 
  ExternalLink, Link as LinkIcon, FileText, Clock, Users, ChevronLeft, Github, 
  Video, ImageIcon, Rocket, X, Download, ShieldCheck, Zap, Info, Scale, Share2, 
  Loader2, BookOpen, Plus, Upload, Trash2, Radio, Heart, Check, Archive
} from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CraftsmanHoverCard from "../cards/CraftsmanHoverCard";

const ChallengeDetailsContent = ({ challenge, isGuest, onRequireAuth, user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(challenge);
  const [timeLeft, setTimeLeft] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const isHost = user && currentChallenge.craftsman && (currentChallenge.craftsman?._id || currentChallenge.craftsman) === user._id;

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

  useEffect(() => {
    setCurrentChallenge(challenge);
    if (user && challenge) {
      const joined = challenge.participants?.some(p => (p.user?._id || p.user) === user._id);
      const submitted = challenge.submissions?.some(s => (s.user?._id || s.user) === user._id);
      setHasJoined(joined);
      setHasSubmitted(submitted);
    }
  }, [challenge, user]);

  const phases = currentChallenge.phases || {};
  const submissionEnd = phases.submissionEnd || currentChallenge.endDate;

  useEffect(() => {
    const status = currentChallenge.status;
    const TERMINAL = ['completed', 'cancelled', 'in_review'];
    const ACTIVE   = ['active', 'registration_open', 'submissions_open'];

    // Immediately set label for terminal/non-countdown statuses
    if (status === 'completed')          { setTimeLeft('Completed');    return; }
    if (status === 'cancelled')          { setTimeLeft('Cancelled');    return; }
    if (status === 'in_review')          { setTimeLeft('Under Review'); return; }
    if (status === 'upcoming' || status === 'draft') { setTimeLeft('Not started yet'); return; }

    // For active phases, run a live countdown against submissionEnd
    if (!submissionEnd) { setTimeLeft('No deadline set'); return; }

    const tick = () => {
      const difference = new Date(submissionEnd) - new Date();
      if (difference <= 0) {
        setTimeLeft('Ended');
        clearInterval(timer);
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        setTimeLeft(`${d}d ${h}h ${m}m`);
      }
    };
    tick(); // run immediately
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, [submissionEnd, currentChallenge.status]);

  const tabs = [
    { id: "overview", label: "Overview", icon: <BookOpen size={14} /> },
    { id: "rules", label: "Guidelines", icon: <FileText size={14} /> },
    { id: "judging", label: "Judging", icon: <Scale size={14} /> },
    { id: "resources", label: "Resources", icon: <LinkIcon size={14} /> },
    { id: "updates", label: "Updates", icon: <Radio size={14} />, count: currentChallenge.updates?.length || 0 },
    { id: "submissions", label: "Submissions", icon: <LayoutIcon size={14} /> }
  ];



  const isActive = currentChallenge.status !== 'completed' && currentChallenge.status !== 'cancelled' && new Date() < new Date(submissionEnd);

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${url}`;
  };

  const handleDownload = async (e, url, title) => {
    e.preventDefault();
    const finalUrl = getFullUrl(url);
    try {
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = title || "file-download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback
      window.open(finalUrl, '_blank');
    }
  };

  return (
    <>
      <div className="max-w-[1250px] mx-auto pt-[31px] pb-6 px-[13px] animate-in fade-in duration-500">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-black dark:hover:text-white transition-colors font-medium text-sm"
          >
            <ChevronLeft size={16} />
            Back to Challenges
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 items-start">
          <div className="col-span-1 space-y-6">
            
            {/* Banner Image */}
            {currentChallenge.coverImage && (
              <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-slate-100 dark:border-white/5">
                <img 
                  src={currentChallenge.coverImage} 
                  alt="Banner" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                />
              </div>
            )}

            {/* Header Section */}
            <div className="pt-4 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                 <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight leading-tight">
                    {currentChallenge.title}
                 </h1>
                 <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-3">
                    <div className="flex items-center gap-1.5">
                       <Clock size={14} />
                       {['Ended','Completed','Cancelled','Under Review','Not started yet','No deadline set'].includes(timeLeft)
                         ? <span>{timeLeft || '\u2014'}</span>
                         : <span>{timeLeft || '\u2014'} REMAINING</span>
                       }
                     </div>
                    <div className="flex items-center gap-1.5"><Users size={14} /> {currentChallenge.participants?.length || 0} OPERATIVES</div>
                 </div>
              </div>

            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar border-b border-slate-100 dark:border-white/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                      : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1.5 px-2 py-0.5 rounded-lg text-[10px] ${
                      activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Dynamic Content */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                   <motion.div 
                     key="overview" 
                     initial={{opacity:0, y: 10}} 
                     animate={{opacity:1, y: 0}} 
                     exit={{opacity:0, y: -10}} 
                     className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                   >
                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Mission Intelligence</h3>
                         <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">
                            {currentChallenge.description}
                         </div>
                      </section>

                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Tech Stack Requirements</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                           <div className="space-y-6">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approved Stack</p>
                             <div className="flex flex-wrap gap-2">
                               {currentChallenge.techStack?.allowed?.map((tech, i) => (
                                 <span key={i} className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                   {tech}
                                 </span>
                               ))}
                             </div>
                           </div>
                           <div className="space-y-6">
                             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Participation Format</p>
                             <p className="text-sm font-bold text-slate-900 dark:text-white">
                               {currentChallenge.teamConfiguration?.participationType === 'Solo' ? 'Individual Operative' : 'Team Deployment'}
                             </p>
                           </div>
                         </div>
                      </section>
                   </motion.div>
                )}

                {activeTab === "rules" && (
                   <motion.div 
                     key="rules" 
                     initial={{opacity:0, y: 10}} 
                     animate={{opacity:1, y: 0}} 
                     exit={{opacity:0, y: -10}} 
                     className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                   >
                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Operational Guidelines</h3>
                         <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">
                            {currentChallenge.rules || "No specific guidelines defined for this mission."}
                         </div>
                      </section>
                   </motion.div>
                )}

                {activeTab === "judging" && (
                   <motion.div 
                     key="judging" 
                     initial={{opacity:0, y: 10}} 
                     animate={{opacity:1, y: 0}} 
                     exit={{opacity:0, y: -10}} 
                     className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                   >
                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Judging Protocols</h3>
                         <div className="grid grid-cols-1 gap-6">
                             {currentChallenge.judgingCriteria?.length > 0 ? currentChallenge.judgingCriteria.map((item, i) => (
                                <div key={i} className="p-5 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between gap-4">
                                   <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">{item.criterion}</p>
                                   <span className="shrink-0 text-xs font-black text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full">{item.weight}% Weight</span>
                                </div>
                             )) : (
                                <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                                   <p className="text-sm text-slate-400 font-medium">No judging criteria defined.</p>
                                </div>
                             )}



                         </div>
                      </section>
                   </motion.div>
                )}

                {activeTab === "resources" && (
                   <motion.div 
                     key="resources" 
                     initial={{opacity:0, y: 10}} 
                     animate={{opacity:1, y: 0}} 
                     exit={{opacity:0, y: -10}} 
                     className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                   >
                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Mission Assets</h3>
                         {currentChallenge.resources?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {currentChallenge.resources.map((res, i) => {
                                  const url = res.url || "";
                                  const cleanUrl = url.split('?')[0].split('#')[0];
                                  const isImage = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(cleanUrl) || url.includes('cloudinary.com') || url.includes('i.ibb.co');
                                  const isFile = /\.(zip|rar|7z|pdf|docx|txt)$/i.test(cleanUrl) || res.type === 'file' || url.includes('submission');

                                  if (isImage) {
                                    return (
                                      <button 
                                        onClick={() => setSelectedImage(url)}
                                        key={i}
                                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/40 transition-all group w-full text-left"
                                      >
                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-black/40 flex items-center justify-center text-slate-400 shadow-sm overflow-hidden">
                                           <img src={url} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{res.name || res.title || 'Resource Image'}</p>
                                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Visual Asset {i+1}</p>
                                        </div>
                                        <ImageIcon size={14} className="text-slate-300" />
                                      </button>
                                    );
                                  }

                                  return (
                                    <a 
                                      href={isFile ? getFullUrl(url) : url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      onClick={(e) => {
                                        if (isFile) {
                                          handleDownload(e, url, res.name || res.title || 'Data-Payload');
                                        }
                                      }}
                                      key={i}
                                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/40 transition-all group cursor-pointer"
                                    >
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isFile ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-white dark:bg-black/40 text-slate-400'}`}>
                                         {isFile ? <Download size={18} /> : <LinkIcon size={18} />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{res.name || res.title || 'Resource'}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{isFile ? 'Data Payload' : 'External Node'} {i+1}</p>
                                      </div>
                                      <ExternalLink size={14} className="text-slate-300" />
                                    </a>
                                  );
                                })}
                            </div>
                         ) : (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                               <p className="text-sm text-slate-400 font-medium">No mission assets available.</p>
                            </div>
                         )}
                      </section>
                   </motion.div>
                )}

                {activeTab === "updates" && (
                   <motion.div 
                     key="updates" 
                     initial={{opacity:0, y: 10}} 
                     animate={{opacity:1, y: 0}} 
                     exit={{opacity:0, y: -10}} 
                     className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                   >
                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Signal Log</h3>
                         <div className="space-y-6">
                            {currentChallenge.updates?.length > 0 ? [...currentChallenge.updates].reverse().map((update, i) => (
                               <div key={i} className="relative pl-8 border-l-2 border-slate-100 dark:border-white/5 pb-8 last:pb-0">
                                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-900 dark:bg-white border-4 border-white dark:border-[#0a0a0a]" />
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{new Date(update.createdAt).toLocaleString()}</p>
                                  <div className="p-6 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-2xl">
                                     <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{update.content}</p>
                                  </div>
                               </div>
                            )) : (
                               <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                                  <p className="text-sm text-slate-400 font-medium">No updates broadcasted yet.</p>
                               </div>
                            )}
                         </div>
                      </section>
                   </motion.div>
                )}

                {activeTab === "submissions" && (
                   <motion.div 
                     key="submissions" 
                     initial={{opacity:0, y: 10}} 
                     animate={{opacity:1, y: 0}} 
                     exit={{opacity:0, y: -10}} 
                     className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                   >
                      <section className="space-y-8">
                         <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1">Deployed Artifacts ({currentChallenge.submissions?.length || 0})</h3>
                         {currentChallenge.submissions?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {currentChallenge.submissions.map((sub, i) => (
                                <div key={i} className="p-5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col gap-4">
                                  <div className="flex items-center gap-3">
                                    <CraftsmanHoverCard
                                      userId={sub.user?._id || sub.user}
                                      username={sub.user?.username}
                                      avatarUrl={sub.user?.profilePicture}
                                      displayName={sub.user?.name}
                                    >
                                      <div className="w-10 h-10 rounded-full bg-white dark:bg-black/40 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm cursor-pointer">
                                        {sub.user?.profilePicture ? <img src={sub.user.profilePicture} alt="" className="w-full h-full object-cover" /> : <div className="font-bold text-slate-400">{sub.user?.name?.[0]}</div>}
                                      </div>
                                    </CraftsmanHoverCard>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.title}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        by <CraftsmanHoverCard
                                              userId={sub.user?._id || sub.user}
                                              username={sub.user?.username}
                                              avatarUrl={sub.user?.profilePicture}
                                              displayName={sub.user?.name}
                                              wrapperDisplay="inline"
                                            >
                                              <span className="font-bold text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors ml-1">{sub.user?.name}</span>
                                            </CraftsmanHoverCard>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                     {sub.liveUrl && <a href={sub.liveUrl} target="_blank" className="flex-1 py-2.5 bg-white dark:bg-black/40 text-slate-900 dark:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 text-center hover:bg-slate-50 transition-colors">Preview</a>}
                                     {sub.githubLink && <a href={sub.githubLink} target="_blank" className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg transition-colors hover:opacity-80"><Github size={14} /></a>}
                                  </div>
                                </div>
                              ))}
                            </div>
                         ) : (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                               <p className="text-sm text-slate-400 font-medium">No artifacts deployed yet.</p>
                            </div>
                         )}
                      </section>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Footer Removed - Moved to Header */}
          </div>
        </div>
      </div>

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
                    Scroll to Zoom â€¢ Drag to Pan â€¢ Click backdrop to close
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ChallengeDetailsContent;

