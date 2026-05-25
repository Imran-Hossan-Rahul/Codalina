# Deployment & Setup Guide

## 🚀 Quick Start (Development)

### Prerequisites

- **Node.js**: v20+ 
- **MongoDB**: v7.0+
- **Redis**: v7.0+
- **npm** or **yarn**

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/codalina.git
cd codalina
```

#### 2. Backend Setup

```bash
cd codalina-backend
npm install
```

Create `.env` file:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/codalina

# JWT Secrets (Generate with: openssl rand -hex 64)
JWT_SECRET_ACCESS_TOKEN=your_access_secret_here
JWT_SECRET_REFRESH_TOKEN=your_refresh_secret_here
JWT_ISSUER=codalina.com

# Encryption Key
ENCRYPTION_KEY=your_encryption_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis
REDIS_URL=redis://localhost:6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Super Admin
SUPER_ADMIN_EMAIL=admin@codalina.com
SUPER_ADMIN_PASSWORD=SecurePassword123!
```

Start backend:
```bash
npm run dev
```

#### 3. Frontend Setup

```bash
cd ../codalina-frontend
npm install
```

Create `.env.local` file:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start frontend:
```bash
npm run dev
```

#### 4. Start Workers (Optional)

```bash
cd codalina-backend
npm run start:craftsman
```

### Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

---

## 🏭 Production Deployment

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Production Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Vercel)                                       │
│      ↓                                                   │
│  CDN (Cloudflare)                                        │
│      ↓                                                   │
│  Load Balancer                                           │
│      ↓                                                   │
│  Backend Servers (AWS (EC2/ECS))                        │
│      ↓                                                   │
│  MongoDB Atlas (Replica Set)                             │
│  Redis Cloud                                             │
│  Cloudinary                                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1. Database Setup (MongoDB Atlas)

#### Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create new cluster (M10+ for production)
3. Configure network access (whitelist IPs)
4. Create database user
5. Get connection string

#### Indexes Setup
```javascript
// Run this script after deployment
node scripts/addPerformanceIndexes.js
node scripts/addSearchIndexes.js
```

#### Backup Strategy
- Enable automated backups (Atlas)
- Retention: 7 days minimum
- Point-in-time recovery enabled

---

### 2. Redis Setup (Redis Cloud)

#### Create Instance
1. Go to [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. Create new database
3. Choose appropriate plan (1GB+ for production)
4. Get connection URL

#### Configuration
```env
REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345
```

---

### 3. Cloudinary Setup

#### Create Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create account
3. Get credentials from dashboard

#### Configuration
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Upload Presets
- Create upload preset for artifacts
- Enable auto-optimization
- Set folder structure

---

### 4. Backend Deployment (AWS ECS)

#### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
```

#### Deploy to AWS ECS
1. Connect GitHub repository
2. Create new Web Service
3. Configure environment variables
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Deploy

#### Environment Variables
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://codalina.vercel.app
PRODUCTION_DOMAIN=codalina.vercel.app
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
# ... all other env vars
```

---

### 5. Frontend Deployment (Vercel)

#### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "https://api.codalina.com",
    "NEXT_PUBLIC_SOCKET_URL": "https://api.codalina.com"
  }
}
```

#### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

Or via GitHub integration:
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

---

### 6. Worker Deployment

#### Separate Worker Service
```bash
# Create separate AWS ECS service for workers
# Start command:
node craftsmans/index.js
```

#### Worker Configuration
```javascript
// craftsmans/index.js
import { Worker } from 'bullmq';
import redis from '../config/redis.js';

// Start all workers
const workers = [
  new Worker('scan-queue', scanWorker, { connection: redis }),
  new Worker('ranking-queue', rankingWorker, { connection: redis }),
  new Worker('notification-queue', notificationWorker, { connection: redis }),
  // ... more workers
];

console.log('Workers started');
```

---

## 🔒 Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] CSRF protection active
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Helmet security headers
- [ ] HTTPS enforced

### Post-Deployment

- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Redis access restricted
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Backup strategy tested
- [ ] Disaster recovery plan

---

## 📊 Monitoring & Logging

### Application Monitoring

#### Winston Logger Setup
```javascript
// utils/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

#### Log Rotation
```javascript
// Daily rotation
import 'winston-daily-rotate-file';

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});
```

### Performance Monitoring

#### Health Check Endpoint
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

#### Detailed Health Check (Admin Only)
```javascript
app.get('/health/detailed', protect, adminOnly, async (req, res) => {
  const health = {
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: await redis.ping() === 'PONG' ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  res.json(health);
});
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to AWS ECS
        run: |
          curl -X POST ${{ secrets.AWS_ECS_UPDATE_HOOK }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🗄️ Database Migration

### Migration Scripts

```javascript
// scripts/migrate.js
import mongoose from 'mongoose';
import User from './models/User.model.js';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Example: Add new field to all users
  await User.updateMany(
    { gamification: { $exists: false } },
    { 
      $set: { 
        gamification: {
          xp: 0,
          level: 1,
          badges: []
        }
      }
    }
  );
  
  console.log('Migration completed');
  process.exit(0);
}

migrate();
```

### Running Migrations
```bash
node scripts/migrate.js
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check connection string
# Whitelist IP in MongoDB Atlas
# Verify credentials
```

#### 2. Redis Connection Failed
```bash
# Check Redis URL format
# Verify Redis instance is running
# Check firewall rules
```

#### 3. Socket.io Not Connecting
```bash
# Check CORS configuration
# Verify WebSocket support
# Check proxy settings
```

#### 4. File Upload Failing
```bash
# Check Cloudinary credentials
# Verify file size limits
# Check multer configuration
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# MongoDB debug
MONGODB_DEBUG=true npm run dev

# Redis debug
REDIS_DEBUG=true npm run dev
```

---

## 📈 Scaling Strategy

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
upstream backend {
    least_conn;
    server backend1.example.com:5000;
    server backend2.example.com:5000;
    server backend3.example.com:5000;
}

server {
    listen 80;
    server_name api.codalina.com;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Socket.io Adapter (Redis)
```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching
- Use CDN for static assets

---

## 🎯 Performance Optimization

### Backend Optimizations

1. **Database Indexing**
```javascript
// Add indexes for frequently queried fields
userSchema.index({ email: 1 });
artifactSchema.index({ user: 1, status: 1 });
```

2. **Redis Caching**
```javascript
// Cache frequently accessed data
const cached = await redis.get(`artifact:${id}`);
if (cached) return JSON.parse(cached);

const artifact = await Artifact.findById(id);
await redis.set(`artifact:${id}`, JSON.stringify(artifact), 'EX', 3600);
```

3. **Query Optimization**
```javascript
// Use lean() for read-only queries
const artifacts = await Artifact.find().lean();

// Select only needed fields
const users = await User.find().select('name email profilePicture');

// Batch operations
const userIds = artifacts.map(a => a.user);
const users = await User.find({ _id: { $in: userIds } });
```

### Frontend Optimizations

1. **Code Splitting**
```javascript
// Dynamic imports
const Editor = dynamic(() => import('./Editor'), { ssr: false });
```

2. **Image Optimization**
```javascript
// Next.js Image component
<Image 
  src={artifact.previewFile} 
  width={400} 
  height={300} 
  alt={artifact.title}
  loading="lazy"
/>
```

3. **Caching Strategy**
```javascript
// SWR for data fetching
const { data, error } = useSWR('/api/artifacts', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000
});
```

---

## 📝 Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check system health
- Review performance metrics

#### Weekly
- Database backup verification
- Security updates
- Performance optimization

#### Monthly
- Database cleanup
- Log rotation
- Dependency updates
- Security audit

### Backup Strategy

```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="$MONGODB_URI" --out="/backups/$DATE"
tar -czf "/backups/$DATE.tar.gz" "/backups/$DATE"
rm -rf "/backups/$DATE"

# Upload to S3
aws s3 cp "/backups/$DATE.tar.gz" "s3://codalina-backups/"
```

---

**Deployment Guide Version:** 1.0  
**Last Updated:** January 2024  
**Maintained by:** Imran Hossan
