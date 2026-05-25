/**
 * Professional Tracker Engine
 * Inspired by Upwork's Desktop Patron.
 * Handles: 10m Segmentation, Randomized Snapshots, Activity Monitoring, Offline Caching.
 */

class TrackerEngine {
  constructor(config = {}) {
    this.contractId = config.contractId;
    this.onSnapshot = config.onSnapshot || (() => {});
    this.onSync = config.onSync || (() => {});
    this.autoStartStream = config.autoStartStream || false;
    
    this.isActive = false;
    this.currentSession = null;
    this.startTime = null;
    
    // Activity Counters
    this.keyboardCount = 0;
    this.mouseCount = 0;
    
    // Segmentation
    this.segmentDuration = 10 * 60 * 1000; // 10 minutes
    // Media Stream for Snapshots
    this.stream = null;
    this.imageCapture = null;
    
    // Event Listeners
    this.setupListeners();
  }

  setupListeners() {
    if (typeof window === 'undefined') return;

    let lastMouseMove = 0;
    const throttle = 1000; // Count mouse move once per second max

    document.addEventListener('keydown', () => { if (this.isActive) this.keyboardCount++; });
    document.addEventListener('mousedown', () => { if (this.isActive) this.mouseCount++; });
    document.addEventListener('wheel', () => { if (this.isActive) this.mouseCount++; });
    document.addEventListener('mousemove', () => { 
      if (this.isActive && Date.now() - lastMouseMove > throttle) {
        this.mouseCount++; 
        lastMouseMove = Date.now();
      }
    });
  }

  async start(sessionData) {
    this.isActive = true;
    this.currentSession = sessionData;
    this.startTime = Date.now();
    this.resetSegment();
    
    if (this.autoStartStream) {
      await this.requestStream();
    }

    // Trigger an initial snapshot after 15 seconds (to allow user to start working)
    this.initialSnapshotTimeout = setTimeout(() => {
      if (this.isActive) this.triggerSnapshot();
    }, 15000);
    
    this.tickInterval = setInterval(() => this.tick(), 1000);
    console.log("Tracker Engine: Initialized. Initial snapshot in 15s.");
  }

  async requestStream() {
    try {
      // Request stream ONCE at start to avoid repeated popups
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        this.stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: "always" }, 
          audio: false 
        });
        
        // Handle stream stop (user manually stops sharing via browser bar)
        this.stream.getVideoTracks()[0].onended = () => {
          // Keep active but mark stream as null
          this.stream = null;
        };
        return true;
      }
    } catch (err) {
      console.warn("Tracker Engine: Initial stream capture failed.", err);
    }
    return false;
  }

  stop() {
    this.isActive = false;
    clearInterval(this.tickInterval);
    clearTimeout(this.initialSnapshotTimeout);
    
    // Clean up stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    return {
      duration: Math.round((Date.now() - this.startTime) / 60000),
      finalActivity: this.calculateActivityScore()
    };
  }

  resetSegment() {
    this.currentSegmentStart = Date.now();
    this.keyboardCount = 0;
    this.mouseCount = 0;
    
    // Schedule exactly one random snapshot within the next 10 minutes
    const randomOffset = Math.floor(Math.random() * this.segmentDuration);
    this.nextSnapshotTime = this.currentSegmentStart + randomOffset;
    
    console.log(`Tracker Engine: Next snapshot scheduled in ${Math.round(randomOffset / 1000)}s`);
  }

  tick() {
    if (!this.isActive) return;

    const now = Date.now();
    
    // Check if it's time for a snapshot
    if (now >= this.nextSnapshotTime && this.nextSnapshotTime !== null) {
      this.triggerSnapshot();
      this.nextSnapshotTime = null; // Ensure only one per segment
    }

    // Check if segment ended
    if (now - this.currentSegmentStart >= this.segmentDuration) {
      this.syncSegment();
      this.resetSegment();
    }
  }

  calculateActivityScore() {
    // Basic logic: Max hits for full activity score
    const totalHits = this.keyboardCount + this.mouseCount;
    // Assume 300 hits per 10 mins is a high activity level
    const score = Math.min(10, Math.ceil((totalHits / 300) * 10));
    return score;
  }

  async triggerSnapshot() {
    console.log("Tracker Engine: Capturing Snapshot...");
    
    let snapshotData = null;
    let activeWindow = document.title || "Web Browser";

    try {
      if (this.stream && this.stream.active) {
        const track = this.stream.getVideoTracks()[0];
        const capture = new ImageCapture(track);
        const bitmap = await capture.grabFrame();
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        snapshotData = canvas.toDataURL('image/webp', 0.4); // Compressed
      }
    } catch (err) {
      console.warn("Tracker Engine: Background capture failed.", err);
    }

    const data = {
      timestamp: new Date(),
      activityLevel: this.calculateActivityScore(),
      keyboardCount: this.keyboardCount,
      mouseCount: this.mouseCount,
      activeWindow: activeWindow,
      screenshots: snapshotData ? [snapshotData] : [],
      capturedAt: new Date()
    };

    this.onSnapshot(data);
    this.cacheOffline(data);
  }

  cacheOffline(data) {
    const offlineLogs = JSON.parse(localStorage.getItem('offline_tracker_logs') || '[]');
    offlineLogs.push({ ...data, contractId: this.contractId });
    localStorage.setItem('offline_tracker_logs', JSON.stringify(offlineLogs));
  }

  async syncSegment() {
    const score = this.calculateActivityScore();
    this.onSync({
      activityLevel: score,
      keyboardCount: this.keyboardCount,
      mouseCount: this.mouseCount
    });
  }
}

export default TrackerEngine;
