# Code Samples - Technical Implementation Showcase

This document showcases key technical implementations that demonstrate advanced full-stack development skills.

## 🔐 Authentication System

### JWT Token Management with Refresh Token Rotation

```javascript
// services/auth.service.js

import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken.model.js";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../config/index.js";

/**
 * Generate Access Token (Short-lived)
 * @param {Object} user - User object
 * @returns {String} JWT access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_ACCESS_SECRET,
    { expiresIn: "15m", issuer: "codalina.com" }
  );
};

/**
 * Generate Refresh Token with Rotation
 * @param {Object} user - User object
 * @param {String} userAgent - Browser user agent
 * @param {String} ip - User IP address
 * @returns {Object} Token and document
 */
export const generateRefreshToken = async (user, userAgent, ip) => {
  const token = jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "30d", issuer: "codalina.com" }
  );

  const refreshTokenDoc = await RefreshToken.create({
    user: user._id,
    token,
    userAgent,
    ip,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { token, refreshTokenDoc };
};

/**
 * Rotate Refresh Token (Security Best Practice)
 * @param {Object} oldTokenDoc - Old refresh token document
 * @param {String} userAgent - Browser user agent
 * @param {String} ip - User IP address
 * @returns {Object} New token and document
 */
export const rotateRefreshToken = async (oldTokenDoc, userAgent, ip) => {
  // Revoke old token
  oldTokenDoc.status = 'revoked';
  await oldTokenDoc.save();

  // Generate new token
  const newToken = jwt.sign(
    { id: oldTokenDoc.user },
    JWT_REFRESH_SECRET,
    { expiresIn: "30d", issuer: "codalina.com" }
  );

  const newTokenDoc = await RefreshToken.create({
    user: oldTokenDoc.user,
    token: newToken,
    userAgent,
    ip,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { token: newToken, refreshTokenDoc: newTokenDoc };
};
```

### CSRF Protection Implementation

```javascript
// server.js - CSRF Middleware

import crypto from "crypto";

/**
 * Double-Submit Cookie Pattern for CSRF Protection
 * Industry-standard security implementation
 */
const csrfProtection = (req, res, next) => {
  // 1. Generate token if not exists
  let csrfToken = req.cookies["XSRF-TOKEN"];
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString("hex");
    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false, // Must be readable by frontend
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }

  // 2. Validate for state-changing methods
  const stateChangingMethods = ["POST", "PUT", "DELETE", "PATCH"];
  if (stateChangingMethods.includes(req.method)) {
    const headerToken = req.headers["x-xsrf-token"];
    if (!headerToken || headerToken !== csrfToken) {
      logger.warn(`[SECURITY] CSRF attempt blocked: ${req.method} ${req.path}`);
      return res.status(403).json({ 
        success: false, 
        message: "Invalid CSRF token" 
      });
    }
  }

  // 3. Attach to request for controllers
  req.csrfToken = csrfToken;
  next();
};
```

## 🚀 Performance Optimization

### Redis-based Cooldown System

```javascript
// controllers/artifactController.js

import redis from "../utils/redisClient.js";

/**
 * Increment View with Cooldown (Prevents spam)
 * Uses Redis for O(1) performance
 */
export const incrementView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const artifact = await Artifact.findById(id).select("_id isActive");
  
  if (!artifact || !artifact.isActive) {
    return res.status(404).json({ 
      success: false, 
      message: "Artifact not found." 
    });
  }

  // Identify actor (user or IP)
  const userId = req.user?._id?.toString() || null;
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const actor = userId || ip;

  // Cooldown check (60 seconds)
  const cooldownKey = `views:cooldown:${id}:${actor}`;
  const set = await redis.set(
    cooldownKey,
    "1",
    "NX",  // Only set if not exists
    "EX",  // Expiry
    60     // 60 seconds
  );

  if (!set) {
    return res.status(200).json({ 
      success: true, 
      counted: false, 
      message: "Cooldown active" 
    });
  }

  // Increment view counter
  const countKey = `views:count:${id}`;
  await redis.incr(countKey);
  await redis.expire(countKey, 300); // 5 min TTL

  // Update trending score
  await redis.zincrby("artifacts:trending:zset", 1, id);

  return res.status(200).json({ success: true, counted: true });
});
```

### Queue-based Background Processing

```javascript
// queues/scanQueue.js

import { Queue, Worker } from "bullmq";
import redis from "../config/redis.js";
import Artifact from "../models/Artifact.model.js";
import { scanZipFile } from "../utils/securityScanner.js";

/**
 * Security Scan Queue
 * Processes artifact uploads in background
 */
export const scanQueue = new Queue("scan-queue", { 
  connection: redis 
});

/**
 * Scan Worker
 * Handles security scanning of uploaded files
 */
const scanWorker = new Worker(
  "scan-queue",
  async (job) => {
    const { artifactId, devlogFileUrl } = job.data;

    try {
      // Download and scan file
      const scanResult = await scanZipFile(devlogFileUrl);

      // Update artifact with scan results
      await Artifact.findByIdAndUpdate(artifactId, {
        "scanResult.scanned": true,
        "scanResult.passed": scanResult.passed,
        "scanResult.errors": scanResult.errors,
        "scanResult.warnings": scanResult.warnings,
        "scanResult.scannedAt": new Date(),
        status: scanResult.passed ? "approved" : "rejected",
      });

      return { success: true, artifactId };
    } catch (error) {
      logger.error(`Scan failed for artifact ${artifactId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process 5 scans simultaneously
    limiter: {
      max: 10,      // Max 10 jobs
      duration: 1000 // Per second
    }
  }
);

// Error handling
scanWorker.on("failed", (job, err) => {
  logger.error(`Scan job ${job.id} failed:`, err);
});
```

## 🎨 Advanced Frontend Components

### Custom Rich Text Editor (Tiptap)

```javascript
// components/blog-editor/editor.jsx

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";

/**
 * Advanced Rich Text Editor
 * Features: Slash commands, code highlighting, markdown shortcuts
 */
export default function BlogEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
      }),
      // Custom slash command extension
      SlashCommands,
      // Image upload extension
      ImageUpload,
      // Table extension
      Table,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none",
      },
    },
  });

  return (
    <div className="editor-container">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Real-time Socket.io Integration

```javascript
// utils/socket.js

import { io } from "socket.io-client";

/**
 * Socket.io Client Manager
 * Handles real-time communication
 */
class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.io server
   */
  connect(userId) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
      // Announce user online
      this.socket.emit("user:online", userId);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Restore listeners
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });
  }

  /**
   * Subscribe to event
   */
  on(event, callback) {
    this.listeners.set(event, callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketManager();
```

## 🗄️ Database Design Patterns

### Mongoose Schema with Advanced Features

```javascript
// models/User.model.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    passwordHistory: [{ 
      type: String, 
      select: false 
    }],
    
    // Gamification
    gamification: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      badges: [{
        id: String,
        name: String,
        earnedAt: { type: Date, default: Date.now },
      }],
      streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastCheckIn: Date,
      },
    },

    // Security
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Text index for search
userSchema.index({ 
  name: "text", 
  username: "text", 
  email: "text" 
});

/**
 * Pre-save hook: Hash password
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // Check password reuse
    if (this.passwordHistory?.length > 0) {
      for (let oldHash of this.passwordHistory) {
        if (await bcrypt.compare(this.password, oldHash)) {
          throw new Error("Cannot reuse old password");
        }
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);

    // Save to history
    if (!this.passwordHistory) this.passwordHistory = [];
    if (this.passwordHistory.length >= 5) {
      this.passwordHistory.shift();
    }
    this.passwordHistory.push(hashedPassword);

    this.password = hashedPassword;
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Method: Compare password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method: Increment login attempts
 */
userSchema.methods.incrementLoginAttempts = async function (ip) {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
  }

  this.loginAttempts += 1;

  // Lock after 5 attempts
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  }

  await this.save();
};

export default mongoose.model("User", userSchema);
```

### Audit Logging Pattern

```javascript
// models/AuditLog.model.js

import mongoose from "mongoose";

/**
 * Audit Log Model
 * Tracks all critical actions for security and compliance
 */
const auditLogSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["User", "Artifact", "Contract", "Job"],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    ip: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound index for efficient queries
auditLogSchema.index({ targetId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
```

## 🔄 Real-time Features

### WebSocket Chat Implementation

```javascript
// server.js - Socket.io Setup

import { Server } from "socket.io";

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Track online users
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let authenticatedUserId = null;

  // User announces online status
  socket.on("user:online", (userId) => {
    authenticatedUserId = userId;
    
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Broadcast online status
    io.emit("user:status", { userId, status: "online" });
  });

  // Join chat room
  socket.on("chat:join", (chatId) => {
    socket.join(chatId);
  });

  // Typing indicator
  socket.on("typing:start", ({ chatId, userId }) => {
    socket.to(chatId).emit("user:typing", { userId, typing: true });
  });

  socket.on("typing:stop", ({ chatId, userId }) => {
    socket.to(chatId).emit("user:typing", { userId, typing: false });
  });

  // Message unsend (with ownership check)
  socket.on("message:unsend", async ({ chatId, messageId }) => {
    if (!authenticatedUserId) return;

    const Message = await import("./models/Message.model.js");
    const msg = await Message.default.findById(messageId);
    
    // Verify ownership
    if (msg.sender.toString() !== authenticatedUserId) {
      console.warn("Unauthorized unsend attempt");
      return;
    }

    await Message.default.findByIdAndUpdate(messageId, { 
      isUnsent: true 
    });
    
    io.to(chatId).emit("message:unsend", { messageId });
  });

  // Disconnect
  socket.on("disconnect", async () => {
    if (authenticatedUserId && onlineUsers.has(authenticatedUserId)) {
      const userSockets = onlineUsers.get(authenticatedUserId);
      userSockets.delete(socket.id);
      
      if (userSockets.size === 0) {
        onlineUsers.delete(authenticatedUserId);
        io.emit("user:status", { 
          userId: authenticatedUserId, 
          status: "offline" 
        });
      }
    }
  });
});
```

## 📊 Analytics Implementation

### Session Tracking

```javascript
// utils/trackers/SessionRecorder.js

/**
 * Session Recorder
 * Captures user interactions for replay and analysis
 */
class SessionRecorder {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.isRecording = false;
  }

  /**
   * Start recording session
   */
  start() {
    if (this.isRecording) return;
    this.isRecording = true;

    // Record mouse movements
    document.addEventListener("mousemove", this.recordMouseMove);
    
    // Record clicks
    document.addEventListener("click", this.recordClick);
    
    // Record scrolls
    document.addEventListener("scroll", this.recordScroll);
    
    // Record page changes
    this.recordPageView();
  }

  /**
   * Record mouse movement
   */
  recordMouseMove = (e) => {
    this.events.push({
      type: "mousemove",
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now() - this.startTime,
    });
  };

  /**
   * Record click
   */
  recordClick = (e) => {
    this.events.push({
      type: "click",
      x: e.clientX,
      y: e.clientY,
      target: e.target.tagName,
      timestamp: Date.now() - this.startTime,
    });
  };

  /**
   * Send events to backend (batched)
   */
  async flush() {
    if (this.events.length === 0) return;

    try {
      await fetch("/api/v1/track/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: this.events,
          duration: Date.now() - this.startTime,
        }),
      });

      this.events = [];
    } catch (error) {
      console.error("Failed to send session data:", error);
    }
  }

  /**
   * Stop recording
   */
  stop() {
    this.isRecording = false;
    document.removeEventListener("mousemove", this.recordMouseMove);
    document.removeEventListener("click", this.recordClick);
    document.removeEventListener("scroll", this.recordScroll);
    this.flush();
  }
}

export default SessionRecorder;
```

## 🎯 Best Practices Demonstrated

### 1. Error Handling
```javascript
// Centralized error handling
app.use((err, req, res, next) => {
  logger.error(`Error ${err.statusCode}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});
```

### 2. Input Validation
```javascript
// Joi validation schema
import Joi from "joi";

export const registerSchema = () => {
  return Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        "string.pattern.base": 
          "Password must include uppercase, lowercase, number, and special character",
      }),
  });
};
```

### 3. Database Transactions
```javascript
// MongoDB transaction for atomic operations
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Deduct from buyer
  await User.findByIdAndUpdate(
    buyerId,
    { $inc: { walletBalance: -price } },
    { session }
  );

  // Add to seller
  await User.findByIdAndUpdate(
    sellerId,
    { $inc: { walletBalance: price } },
    { session }
  );

  // Record transaction
  await Transaction.create([{ /* ... */ }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

**These code samples demonstrate:**
- Clean, maintainable code
- Security best practices
- Performance optimization
- Scalable architecture
- Modern JavaScript/TypeScript patterns
- Industry-standard implementations

---

### 💼 Advanced Business Logic: Escrow Transaction System

This demonstrates a complex MongoDB transaction handling the escrow of tokens between a client and a craftsman for a job milestone, showcasing platform-specific business logic.

```javascript
/**
 * Processes a milestone payment using MongoDB Transactions
 * Ensures ACID properties for financial operations within the platform
 */
export const releaseMilestoneEscrow = async (contractId, milestoneId, clientId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const contract = await Contract.findById(contractId).session(session);
    if (!contract || contract.client.toString() !== clientId.toString()) {
      throw new Error("Unauthorized or Contract not found");
    }

    const milestone = contract.milestones.id(milestoneId);
    if (milestone.status !== 'approved') {
      throw new Error("Milestone must be approved before releasing funds");
    }

    const amount = milestone.amount;
    const platformFee = amount * 0.10; // 10% platform fee
    const craftsmanPayout = amount - platformFee;

    // 1. Deduct from Escrow Wallet
    await Wallet.findOneAndUpdate(
      { userId: contract.escrowAccount },
      { $inc: { balance: -amount } },
      { session }
    );

    // 2. Add to Craftsman Wallet
    await Wallet.findOneAndUpdate(
      { userId: contract.craftsman },
      { $inc: { balance: craftsmanPayout } },
      { session }
    );

    // 3. Add to Platform Treasury
    await Wallet.findOneAndUpdate(
      { type: 'treasury' },
      { $inc: { balance: platformFee } },
      { session }
    );

    // 4. Update Milestone & Contract Status
    milestone.status = 'paid';
    milestone.paidAt = new Date();
    await contract.save({ session });

    await session.commitTransaction();
    return { success: true, payout: craftsmanPayout };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```
