"use client";

import { useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { initTracker } from '@/utils/AdvancedTracker';
import { DashboardContext } from '@/app/(dashboard)/layout';

/**
 * GlobalTracker Component
 * Orchestrates the world-class AdvancedTracker SDK across the entire platform.
 * Automatically handles user synchronization, session management, and route changes.
 */
export default function GlobalTracker() {
  const pathname = usePathname();
  const dashboardContext = useContext(DashboardContext);
  const user = dashboardContext?.user;

  useEffect(() => {
    // Initialize the advanced tracker singleton
    const tracker = initTracker({
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
      batchSize: 15,
      flushInterval: 5000
    });

    // Check for user in localStorage if context is not available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let initialUserId = user?._id;
    
    if (!initialUserId && token) {
      // We could decode token here, but for now we'll wait for the context update
    }

    // Start the tracking engine
    tracker.init(initialUserId);

    // Track initial page view
    tracker.trackPageView(pathname);

    // Cleanup on unmount
    return () => {
      tracker.stop();
    };
  }, []);

  // Sync User ID when it changes (e.g. login/logout)
  useEffect(() => {
    const tracker = initTracker();
    if (user?._id) {
      tracker.setUserId(user._id);
    }
  }, [user]);

  // Track page changes
  useEffect(() => {
    const tracker = initTracker();
    tracker.trackPageView(pathname);
  }, [pathname]);

  return null; // This is a headless logic component
}
