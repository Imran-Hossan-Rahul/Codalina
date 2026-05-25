"use client";
import React, { useState } from "react";
import GlassNavbar from "../GlassNavbar";
import Sidebar from "../Sidebar";
import RightSidebar from "../RightSidebar";
import ChallengesFeed from "./ChallengesFeed";

export default function ChallengesDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0a0a0a] text-slate-900 dark:text-white overflow-x-hidden">
        
      {/* Background Exciting Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-orange-400/20 rounded-full blur-[140px]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-violet-400/20 rounded-full blur-[140px]" />
      </div>

      <GlassNavbar 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="relative z-10 flex pt-24 px-4 lg:px-6 gap-6 min-h-screen max-w-[1800px] mx-auto">
        
        {/* Left Sidebar */}
        <div className="hidden lg:block w-[240px] flex-shrink-0">
             <div className="fixed top-24 bottom-6 w-[240px] overflow-y-auto">
                <Sidebar />
             </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full min-w-0 pb-20">
            <ChallengesFeed />
        </main>

        {/* Right Sidebar */}
        <div className="hidden xl:block w-[320px] flex-shrink-0">
             <div className="fixed top-24 bottom-6 w-[320px] overflow-y-auto">
                 <RightSidebar />
             </div>
        </div>
      </div>
    </div>
  );
}
