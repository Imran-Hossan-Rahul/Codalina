"use client";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { api } from "@/utils/api";
import { 
  Trophy, Calendar, Zap, Code, PenTool, 
  ArrowRight, ArrowLeft, Clock, Users, Image as ImageIcon, 
  Plus, X, ShieldCheck, Loader2, FileText, Upload,
  Trash2, ChevronRight, Scale, Link as LinkIcon, Link2, CheckCircle2, Palette, Search, 
  UserMinus, UserCheck, EyeOff, Megaphone, Music, Layers, Rocket, Info, Video, Palette as PaletteIcon,
  Cpu, Gamepad2, Camera, Box
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardContext } from "@/app/(dashboard)/layout";
import { useToast } from "@/components/ui/ToastProvider";

const CHALLENGE_CATEGORIES = [
  { id: "Development", label: "Dev", icon: Code },
  { id: "Design", label: "Design", icon: PaletteIcon },
  { id: "AI", label: "AI & Data", icon: Cpu },
  { id: "Web3", label: "Blockchain", icon: LinkIcon },
  { id: "Security", label: "Cyber Security", icon: ShieldCheck },
  { id: "Digital Marketing", label: "Digital Marketing", icon: Megaphone },
  { id: "Video", label: "Video Editing", icon: Video },
  { id: "Business", label: "Sales & Marketing", icon: Rocket },
  { id: "3D", label: "Graphics Design", icon: Box },
  { id: "Others", label: "Other", icon: Layers }
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

const PREDEFINED_SKILLS = [
  "React", "Node.js", "Next.js", "Tailwind CSS", "MongoDB", "Express", 
  "TypeScript", "JavaScript", "Python", "Django", "GraphQL", "Figma", 
  "UI/UX Design", "Docker", "AWS", "Firebase", "PostgreSQL", "Vue.js", "Angular",
  "HTML", "CSS", "Sass", "Java", "C++", "C#", "PHP", "Laravel", "Ruby on Rails",
  "React Native", "Flutter", "Swift", "Kotlin", "Go", "Rust", "SQL", "NoSQL"
];

// Helper to check if color is light or dark for text contrast
const getContrastColor = (hexcolor) => {
  if (!hexcolor) return "white";
  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
};

const CustomSelect = ({ label, value, options, onChange, icon: Icon, themeColor }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative space-y-2">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl outline-none transition-all text-xs font-bold ${
            isOpen ? "ring-4" : "hover:border-slate-300 dark:hover:border-white/20"
          }`}
          style={{ 
            borderColor: isOpen ? themeColor : undefined,
            boxShadow: isOpen ? `${themeColor}15 0 0 0 4px` : undefined
          }}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon size={16} className="text-slate-400" />}
            <span className={value ? "text-slate-900 dark:text-white" : "text-slate-400"}>
              {options.find(opt => opt.value === value)?.label || "Select Option"}
            </span>
          </div>
          <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "circOut" }}
                className="absolute z-[70] w-full mt-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50 overflow-hidden"
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex items-center justify-between uppercase tracking-wider ${
                      value === option.value 
                        ? "" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                    style={value === option.value ? {
                      backgroundColor: themeColor,
                      color: getContrastColor(themeColor)
                    } : {}}
                  >
                    {option.label}
                    {value === option.value && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getContrastColor(themeColor) }} />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CreateChallengeForm = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useContext(DashboardContext) || {};
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "code",
    category: "Development",
    customCategory: "",
    difficulty: "Beginner",
    prize: "", 
    coverImage: null
  });

  const themeStyle = useMemo(() => ({
    primary: "#4f46e5", // Standardized Brand Color
    textOnPrimary: "white",
    light: "#4f46e510",
    border: "#4f46e530",
  }), []);

  const [tags, setTags] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const [rules, setRules] = useState([""]);
  
  const [techStack, setTechStack] = useState({
    allowed: [""],
    avoid: [""]
  });

  const [teamConfiguration, setTeamConfiguration] = useState({
    participationType: "Solo",
    minTeamSize: 1,
    maxTeamSize: 1
  });

  const [phases, setPhases] = useState({
    registrationStart: "",
    registrationEnd: "",
    submissionStart: "",
    submissionEnd: "",
    judgingStart: "",
    judgingEnd: "",
    winnerAnnouncement: ""
  });

  const [rewardDistribution, setRewardDistribution] = useState([
    { rank: 1, amount: "", type: 'cash' }
  ]);

  const [judgingCriteria, setJudgingCriteria] = useState([
    { criterion: "Innovation", weight: 50, description: "Uniqueness of the solution." },
    { criterion: "Execution", weight: 50, description: "Quality of the final artifact." }
  ]);

  const [submissionRequirements, setSubmissionRequirements] = useState({
    requireVideo: false,
    requireDemo: false,
    requireRepo: true,
    requireDocumentation: false
  });

  const [visibility, setVisibility] = useState({
    isPublic: true,
    minLevel: 1,
    allowedUsers: [],
    blockedUsers: []
  });

  const [judges, setJudges] = useState([]);

  // Search state
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchTarget, setSearchTarget] = useState(""); 

  const [resources, setResources] = useState([
    { name: "", url: "", type: "link", file: null }
  ]);

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addArrayItem = (setter, emptyItem) => setter(prev => [...prev, emptyItem]);
  const updateArrayItem = (setter, index, field, value) => {
    setter(prev => {
      const next = [...prev];
      if (typeof next[index] === 'object' && field !== null) {
         next[index][field] = value;
      } else {
         next[index] = value;
      }
      return next;
    });
  };
  const removeArrayItem = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, coverImage: file }));
    }
  };

  const handleSkillSelect = (skill) => {
    if (!tags.includes(skill)) {
      setTags([...tags, skill]);
    }
    setSkillSearch("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const filteredSkills = PREDEFINED_SKILLS.filter(s => 
    s.toLowerCase().includes(skillSearch.toLowerCase()) && !tags.includes(s)
  );

  const searchUsers = async (query) => {
    if (!query) {
      setUserSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const res = await api.get(`/search?q=${query}`);
      if (res.success && res.data.users) {
        setUserSearchResults(res.data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userSearchTerm.length > 2 && searchTarget !== "") {
         searchUsers(userSearchTerm);
      } else {
         setUserSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userSearchTerm]);

  const handleSelectUser = (u) => {
    if (searchTarget === 'judges') {
      if (!judges.some(j => j._id === u._id)) setJudges([...judges, u]);
    }
    setUserSearchTerm("");
    setUserSearchResults([]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title || formData.title.length > 100) newErrors.title = true;
    if (!formData.description) newErrors.description = true;
    if (!formData.coverImage) newErrors.coverImage = true;
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill all required fields correctly.", "warning");
      return false;
    }
    return true;
  };

  const handleCancel = () => router.back();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
          data.append(key, formData[key]);
      });
      
      data.append("tags", JSON.stringify(tags));
      data.append("phases", JSON.stringify(phases));
      data.append("rewardDistribution", JSON.stringify(rewardDistribution));
      data.append("judgingCriteria", JSON.stringify(judgingCriteria));
      data.append("rules", JSON.stringify(rules.filter(r => r.trim() !== "")));
      data.append("techStack", JSON.stringify({
         allowed: techStack.allowed.filter(t => t.trim() !== ""),
         avoid: techStack.avoid.filter(t => t.trim() !== "")
      }));
      data.append("teamConfiguration", JSON.stringify(teamConfiguration));
      data.append("visibility", JSON.stringify(visibility));
      data.append("judges", JSON.stringify(judges.map(j => j._id)));
      data.append("submissionRequirements", JSON.stringify(submissionRequirements));
      
      // Resources handling
      const resourcesToSubmit = resources.filter(r => r.name.trim() !== "" || r.file);
      data.append("resources", JSON.stringify(resourcesToSubmit.map((r, idx) => ({
          name: r.name || (r.file ? r.file.name : "Unnamed Resource"),
          type: r.type,
          url: r.type === 'file' ? `FILE_${idx}` : r.url
      }))));

      resourcesToSubmit.forEach(r => {
          if (r.file) {
              data.append("resourceFiles", r.file);
          }
      });

      const response = await api.upload("/challenges", data);
      if (response.success) {
        showToast("Challenge Deployed", "success");
        router.push("/challenges");
      }
    } catch (error) {
      showToast(error.message || "Deployment failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#050505] pb-32">
      {/* Unified Container */}
      <div className="w-full max-w-7xl px-4 py-6">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">New Challenge</h1>
          <button type="button" onClick={handleCancel} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Form Area */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-sm space-y-10">
            
            {/* Top Grid: Essentials & Branding */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left Column: Essentials */}
              <div className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: themeStyle.primary }} />
                    Devlog Essentials
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Challenge Title</label>
                         <span className={`text-[10px] font-bold ${formData.title.length > 100 ? 'text-red-500' : 'text-slate-400'}`}>{formData.title.length}/100</span>
                      </div>
                      <input 
                        type="text" 
                        maxLength={100} 
                        value={formData.title} 
                        onChange={(e) => { setFormData({...formData, title: e.target.value}); setErrors(p => ({...p, title: false})); }} 
                        placeholder="e.g. NextGen Web3 Hackathon" 
                        className={`w-full bg-slate-50/50 dark:bg-white/[0.02] border ${errors.title ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all`} 
                        style={{ borderColor: !errors.title && formData.title ? themeStyle.primary : undefined }}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mission Briefing</label>
                        <span className={`text-[10px] font-bold ${formData.description.length > 2000 ? 'text-red-500' : 'text-slate-400'}`}>{formData.description.length}/2000</span>
                      </div>
                      <textarea 
                        value={formData.description} 
                        maxLength={2000}
                        onChange={(e) => { setFormData({...formData, description: e.target.value}); setErrors(p => ({...p, description: false})); }} 
                        placeholder="Describe the problem, goals, and technical requirements..." 
                        className={`w-full bg-slate-50/50 dark:bg-white/[0.02] border ${errors.description ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[160px] resize-none transition-all`} 
                        style={{ borderColor: !errors.description && formData.description ? themeStyle.primary : undefined }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: themeStyle.primary }} />
                    Logistics & Rules
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Rules */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Participation Rules</label>
                       {rules.map((rule, i) => (
                         <div key={i} className="flex gap-3">
                           <input 
                             type="text" 
                             value={rule} 
                             onChange={(e) => updateArrayItem(setRules, i, null, e.target.value)} 
                             placeholder={`Rule #${i+1}`} 
                             className="flex-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all focus:border-slate-900 dark:focus:border-white" 
                           />
                           {rules.length > 1 && (
                             <button type="button" onClick={() => removeArrayItem(setRules, i)} className="text-slate-400 hover:text-red-500 p-2">
                               <Trash2 size={16} />
                             </button>
                           )}
                         </div>
                       ))}
                       <button type="button" onClick={() => addArrayItem(setRules, "")} className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors">
                         <Plus size={14} /> Add Rule
                       </button>
                    </div>

                    {/* Judging Criteria */}
                    <div className="space-y-4 pt-4">
                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluation Rubric</label>
                       <div className="space-y-3">
                         {judgingCriteria.map((item, i) => (
                           <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                             <div className="flex gap-3">
                               <input 
                                 type="text" 
                                 value={item.criterion} 
                                 onChange={(e) => updateArrayItem(setJudgingCriteria, i, 'criterion', e.target.value)} 
                                 placeholder="Criterion (e.g. Innovation)" 
                                 className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-slate-400 transition-all" 
                               />
                               <div className="relative w-24">
                                 <input 
                                   type="number" 
                                   value={item.weight} 
                                   onChange={(e) => updateArrayItem(setJudgingCriteria, i, 'weight', parseInt(e.target.value) || 0)} 
                                   className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-slate-400 transition-all pr-8" 
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                               </div>
                               {judgingCriteria.length > 1 && (
                                 <button type="button" onClick={() => removeArrayItem(setJudgingCriteria, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                               )}
                             </div>
                             <textarea 
                               value={item.description} 
                               onChange={(e) => updateArrayItem(setJudgingCriteria, i, 'description', e.target.value)} 
                               placeholder="Briefly describe what judges should look for..." 
                               className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px] font-medium outline-none focus:border-slate-400 transition-all resize-none h-16"
                             />
                           </div>
                         ))}
                         <div className="flex items-center justify-between">
                            <button type="button" onClick={() => addArrayItem(setJudgingCriteria, { criterion: "", weight: 0, description: "" })} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">+ Add Criterion</button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Weight: {judgingCriteria.reduce((s, c) => s + (parseInt(c.weight) || 0), 0)}%</span>
                         </div>
                       </div>
                    </div>

                    {/* Judges Selection */}
                    <div className="space-y-4 pt-4">
                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expert Panel (Judges)</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={userSearchTerm} 
                            onChange={(e) => { setUserSearchTerm(e.target.value); setSearchTarget('judges'); }} 
                            placeholder="Search by name or username..." 
                            className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all focus:border-slate-400" 
                          />
                          {userSearchResults.length > 0 && searchTarget === 'judges' && (
                             <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                {userSearchResults.map(u => (
                                   <button key={u._id} type="button" onClick={() => handleSelectUser(u)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                      <img src={u.profilePicture || "/default-avatar.png"} className="w-8 h-8 rounded-full" />
                                      <div className="text-left">
                                         <p className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</p>
                                         <p className="text-[10px] text-slate-400">@{u.username}</p>
                                      </div>
                                   </button>
                                ))}
                             </div>
                          )}
                       </div>
                       
                       <div className="flex flex-wrap gap-3 pt-2">
                          {judges.map(j => (
                             <div key={j._id} className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full group">
                                <img src={j.profilePicture || "/default-avatar.png"} className="w-6 h-6 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{j.name}</span>
                                <button type="button" onClick={() => setJudges(judges.filter(prev => prev._id !== j._id))} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allowed Stack</label>
                        <div className="space-y-2">
                          {techStack.allowed.map((tech, i) => (
                            <div key={i} className="flex items-center gap-2">
                               <input type="text" value={tech} onChange={(e) => {
                                  const newArr = [...techStack.allowed];
                                  newArr[i] = e.target.value;
                                  setTechStack(p => ({...p, allowed: newArr}));
                               }} placeholder="e.g. React" className="flex-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium outline-none transition-all focus:border-slate-900 dark:focus:border-white" />
                               <button type="button" onClick={() => setTechStack(p => ({...p, allowed: p.allowed.filter((_, idx) => idx !== i)}))} className="text-slate-400"><X size={12}/></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setTechStack(p => ({...p, allowed: [...p.allowed, ""]}))} className="text-[10px] font-bold text-slate-400">Add Tech</button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avoid Stack</label>
                        <div className="space-y-2">
                          {techStack.avoid.map((tech, i) => (
                            <div key={i} className="flex items-center gap-2">
                               <input type="text" value={tech} onChange={(e) => {
                                  const newArr = [...techStack.avoid];
                                  newArr[i] = e.target.value;
                                  setTechStack(p => ({...p, avoid: newArr}));
                               }} placeholder="e.g. jQuery" className="flex-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium outline-none transition-all focus:border-slate-900 dark:focus:border-white" />
                               <button type="button" onClick={() => setTechStack(p => ({...p, avoid: p.avoid.filter((_, idx) => idx !== i)}))} className="text-slate-400"><X size={12}/></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => setTechStack(p => ({...p, avoid: [...p.avoid, ""]}))} className="text-[10px] font-bold text-slate-400">Add Tech</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: themeStyle.primary }} />
                    Expertise & Skills
                  </h3>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Skills (Tags)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={skillSearch} 
                        onChange={(e) => { setSkillSearch(e.target.value); setShowSuggestions(true); }} 
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && skillSearch.trim()) {
                            e.preventDefault();
                            handleSkillSelect(skillSearch.trim());
                          }
                        }}
                        placeholder="Search or press Enter..." 
                        className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all" 
                        style={{ borderColor: skillSearch ? themeStyle.primary : undefined }}
                      />
                      
                      <AnimatePresence>
                        {showSuggestions && skillSearch && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-50 w-full mt-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {filteredSkills.map(skill => (
                              <button key={skill} type="button" onClick={() => handleSkillSelect(skill)} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 font-medium">
                                {skill}
                              </button>
                            ))}
                            {!PREDEFINED_SKILLS.some(s => s.toLowerCase() === skillSearch.toLowerCase()) && (
                              <button type="button" onClick={() => handleSkillSelect(skillSearch)} className="w-full px-4 py-2 text-left text-sm font-bold border-t border-slate-100 dark:border-white/5" style={{ color: themeStyle.primary }}>
                                Add "{skillSearch}"
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {tags.map((tag, i) => (
                         <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-100 dark:border-white/10 uppercase tracking-wider transition-all" style={{ backgroundColor: themeStyle.primary, color: themeStyle.textOnPrimary }}>
                            {tag} <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-70 transition-colors"><X size={10}/></button>
                         </span>
                      ))}
                    </div>
                    
                    {showSuggestions && (
                      <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Visuals & Category */}
              <div className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-indigo-600" />
                    Visual Identity
                  </h3>
                  
                  <div className="space-y-4">
                    <div className={`relative aspect-[21/9] rounded-2xl border-2 border-dashed transition-all group overflow-hidden ${errors.coverImage ? 'border-red-500 bg-red-50' : 'border-slate-100 dark:border-white/5 hover:border-slate-900 dark:hover:border-white bg-transparent'}`}>
                      <input type="file" accept="image/*" onChange={(e) => { handleImageChange(e); setErrors(p => ({...p, coverImage: false})); }} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 flex items-center gap-2 shadow-2xl">
                                <Zap size={14} className="text-white" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Click to Change Hero Image</span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          <ImageIcon size={32} strokeWidth={1.5} className="mb-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider mb-1">Upload Hero Image</span>
                          <span className="text-[9px] font-bold text-slate-400/60 uppercase tracking-[0.15em]">Max 5MB • JPG, PNG, WEBP</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Difficulty</label>
                       <select value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})} className="w-full h-11 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-none appearance-none cursor-pointer focus:border-slate-900 dark:focus:border-white transition-all">
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: themeStyle.primary }} />
                    Devlog Category
                  </h3>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      {CHALLENGE_CATEGORIES.map((cat) => {
                        const isActive = formData.category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.id })}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                              isActive
                                ? "shadow-lg scale-[1.02]"
                                : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 hover:border-slate-300"
                            }`}
                            style={isActive ? {
                              backgroundColor: themeStyle.primary,
                              borderColor: themeStyle.primary,
                              color: themeStyle.textOnPrimary
                            } : {}}
                          >
                            <cat.icon size={20} strokeWidth={2} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                 <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01] space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
                         <Palette size={16} className="text-indigo-600 dark:text-indigo-400" />
                       </div>
                       <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Standard Platform Theme</h4>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-wider">
                      All challenges now follow the unified platform aesthetic to ensure maximum focus on content and quality.
                    </p>
                 </div>
              </div>
            </div>

            {/* Bottom Section: Financial & Timeline */}
            <div className="pt-9 border-t border-slate-100 dark:border-white/5 space-y-10">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: themeStyle.primary }} />
                  Reward Strategy & Timeline
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grand Prize Label</label>
                      <input 
                        type="text" 
                        value={formData.prize} 
                        onChange={(e) => setFormData({...formData, prize: e.target.value})} 
                        placeholder="e.g. $10,000 Equity + Swag" 
                        className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-slate-900 dark:focus:border-white transition-all" 
                        style={{ borderColor: formData.prize ? themeStyle.primary : undefined }}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reward Distribution</label>
                      <div className="space-y-3">
                        {rewardDistribution.map((reward, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center font-bold text-[10px] text-slate-400 border border-slate-100 dark:border-white/5">#{i+1}</div>
                            <input 
                               type="text" 
                               inputMode="numeric"
                               value={reward.amount} 
                               onChange={(e) => {
                                 const val = e.target.value;
                                 if (val === "" || (/^\d+$/.test(val) && Number(val) <= 1000)) {
                                   updateArrayItem(setRewardDistribution, i, 'amount', val);
                                 }
                               }} 
                               max={1000}
                               className="flex-1 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold outline-none transition-all no-spinner focus:border-slate-900 dark:focus:border-white" 
                             />
                            {rewardDistribution.length > 1 && (
                              <button type="button" onClick={() => removeArrayItem(setRewardDistribution, i)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addArrayItem(setRewardDistribution, { rank: rewardDistribution.length + 1, amount: "", type: 'cash' })} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+ Add Prize Slot</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission Start</label>
                        <input 
                          type="datetime-local" 
                          value={phases.submissionStart} 
                          onChange={(e) => setPhases({...phases, submissionStart: e.target.value})} 
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all cursor-pointer focus:border-slate-900 dark:focus:border-white" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</label>
                        <input 
                          type="datetime-local" 
                          value={phases.submissionEnd} 
                          onChange={(e) => setPhases({...phases, submissionEnd: e.target.value})} 
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all cursor-pointer focus:border-slate-900 dark:focus:border-white" 
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Winner Announcement</label>
                        <input 
                          type="datetime-local" 
                          value={phases.winnerAnnouncement} 
                          onChange={(e) => setPhases({...phases, winnerAnnouncement: e.target.value})} 
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all cursor-pointer focus:border-slate-900 dark:focus:border-white" 
                        />
                      </div>
                      <CustomSelect 
                        label="Participation"
                        value={teamConfiguration.participationType}
                        options={[
                          { value: "Solo", label: "Solo Only" },
                          { value: "Team", label: "Team Only" },
                          { value: "Both", label: "Both" }
                        ]}
                        onChange={(val) => setTeamConfiguration({...teamConfiguration, participationType: val})}
                        themeColor={themeStyle.primary}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources & Reference Section */}
              <div className="pt-10 border-t border-slate-100 dark:border-white/5 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: themeStyle.primary }} />
                      Challenge Resources & Assets
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add downloadable files, media, or reference links for participants</p>
                  </div>
                  <button type="button" onClick={() => addArrayItem(setResources, { name: "", url: "", type: "link", file: null })} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
                    <Plus size={14} /> Add Resource
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((res, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4 space-y-4 relative group"
                    >
                      <button type="button" onClick={() => removeArrayItem(setResources, i)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-white dark:bg-white/5 shadow-sm">
                            {res.type === 'link' ? <Link2 size={14} className="text-slate-400" /> : <FileText size={14} className="text-slate-400" />}
                          </div>
                          <input 
                            type="text" 
                            value={res.name} 
                            onChange={(e) => updateArrayItem(setResources, i, 'name', e.target.value)} 
                            placeholder="Resource Name (e.g. Style Guide)" 
                            className="flex-1 bg-transparent border-none text-xs font-bold outline-none placeholder:text-slate-300"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => updateArrayItem(setResources, i, 'type', 'link')}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${res.type === 'link' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/10'}`}
                          >
                            Link
                          </button>
                          <button 
                            type="button" 
                            onClick={() => updateArrayItem(setResources, i, 'type', 'file')}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${res.type === 'file' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/10'}`}
                          >
                            File
                          </button>
                        </div>

                        {res.type === 'link' ? (
                          <input 
                            type="url" 
                            value={res.url} 
                            onChange={(e) => updateArrayItem(setResources, i, 'url', e.target.value)} 
                            placeholder="https://..." 
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-medium outline-none focus:border-slate-400"
                          />
                        ) : (
                          <div className="relative h-9 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center px-3 gap-2 overflow-hidden">
                             <input 
                               type="file" 
                               onChange={(e) => {
                                 const file = e.target.files[0];
                                 if (file) {
                                   updateArrayItem(setResources, i, 'file', file);
                                   updateArrayItem(setResources, i, 'name', res.name || file.name);
                                 }
                               }} 
                               className="absolute inset-0 opacity-0 cursor-pointer" 
                             />
                             <Upload size={12} className="text-slate-400" />
                             <span className="text-[10px] font-bold text-slate-500 truncate">{res.file ? res.file.name : "Choose File"}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission & Footer */}
            <div className="pt-9 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-slate-400">
                <Info size={16} />
                <p className="text-[10px] font-bold uppercase tracking-wider">All data is encrypted and secure before deployment.</p>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3"
                style={{ 
                  backgroundColor: themeStyle.primary,
                  color: themeStyle.textOnPrimary
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    Deploy Challenge
                    <Rocket size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeForm;

