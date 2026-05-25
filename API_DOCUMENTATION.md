# API Documentation

## 📡 REST API Reference

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.codalina.com/api/v1
```

### Authentication

All authenticated endpoints require a JWT token in the Authorization header or as an HTTP-only cookie.

```http
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "Alex - Frontend Developer",
  "email": "alex.dev@codalina.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Alex - Frontend Developer",
    "email": "alex.dev@codalina.com",
    "role": "user",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "csrfToken": "a1b2c3d4e5f6..."
  }
}
```

**Validation Rules:**
- Name: 2-50 characters
- Email: Valid email format
- Password: Min 8 chars, must include uppercase, lowercase, number, and special character

---

### Login

**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "alex.dev@codalina.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Alex - Frontend Developer",
    "email": "alex.dev@codalina.com",
    "role": "user",
    "hasCraftsmanAccount": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "csrfToken": "a1b2c3d4e5f6..."
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `423 Locked`: Account temporarily locked (too many failed attempts)

---

### Refresh Token

**POST** `/auth/refresh-token`

Get a new access token using refresh token.

**Request:** Refresh token sent automatically via HTTP-only cookie

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Access token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Logout

**POST** `/auth/logout`

Revoke refresh token and clear cookies.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

## 📦 Artifact Endpoints

### Get All Artifacts

**GET** `/artifact`

Retrieve paginated list of artifacts.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Text search query
- `category` (string): Filter by category
- `priceType` (string): "free" or "paid"
- `tags` (string): Comma-separated tags
- `sortBy` (string): "popular", "trending", "random"

**Example Request:**
```http
GET /artifact?page=1&limit=20&category=UI&sortBy=trending
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Modern Dashboard Template",
      "slug": "modern-dashboard-template",
      "description": "A beautiful, responsive dashboard template",
      "category": "UI",
      "tags": ["react", "tailwind", "dashboard"],
      "priceType": "paid",
      "price": 49,
      "discount": 20,
      "previewFile": "https://cloudinary.com/...",
      "viewsCount": 1250,
      "downloadsCount": 89,
      "likeCount": 156,
      "isLiked": false,
      "user": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Sarah - Backend Engineer",
        "profilePicture": "https://cloudinary.com/..."
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "currentPage": 1,
    "totalPages": 8
  }
}
```

---

### Get Artifact by ID

**GET** `/artifact/:id`

Retrieve single artifact details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Modern Dashboard Template",
    "description": "A beautiful, responsive dashboard template built with React and Tailwind CSS",
    "category": "UI",
    "tags": ["react", "tailwind", "dashboard"],
    "tech": ["React", "Tailwind CSS", "Next.js"],
    "priceType": "paid",
    "price": 49,
    "discount": 20,
    "discountedPrice": 39.2,
    "previewFile": "https://cloudinary.com/...",
    "devlogFile": "https://cloudinary.com/...",
    "githubLink": "https://github.com/...",
    "liveLink": "https://demo.example.com",
    "viewsCount": 1250,
    "downloadsCount": 89,
    "likeCount": 156,
    "averageRating": 4.7,
    "ratingCount": 23,
    "status": "approved",
    "scanResult": {
      "scanned": true,
      "passed": true,
      "scannedAt": "2024-01-15T10:35:00.000Z"
    },
    "user": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Sarah - Backend Engineer",
      "email": "sarah.backend@codalina.com",
      "profilePicture": "https://cloudinary.com/..."
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Create Artifact

**POST** `/artifact`

Upload a new artifact (requires authentication).

**Headers:**
```http
Content-Type: multipart/form-data
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Form Data:**
- `title` (string, required): Artifact title
- `description` (string, required): Detailed description
- `category` (string, required): Category enum
- `tags` (string): Comma-separated tags
- `tech` (string): Comma-separated technologies
- `priceType` (string): "free" or "paid"
- `price` (number): Price in TKNS (if paid)
- `githubLink` (string): GitHub repository URL
- `liveLink` (string): Live demo URL
- `previewFile` (file, required): Preview image/video
- `devlogFile` (file, required): Source code ZIP

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Artifact uploaded successfully. Security scan in progress.",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Modern Dashboard Template",
    "status": "pending",
    "previewFile": "https://cloudinary.com/...",
    "devlogFile": "https://cloudinary.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Like Artifact

**POST** `/artifact/:artifactId/like`

Toggle like on an artifact.

**Response:** `200 OK`
```json
{
  "success": true,
  "likeCount": 157,
  "isLiked": true,
  "queued": true
}
```

---

### Buy Artifact

**POST** `/artifact/:id/buy`

Purchase a paid artifact using wallet balance.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Artifact purchased successfully!",
  "data": {
    "walletBalance": 450.80
  }
}
```

**Error Responses:**
- `400 Bad Request`: Insufficient balance
- `404 Not Found`: Artifact not found
- `200 OK`: Already purchased

---

## 💬 Chat Endpoints

### Get User Chats

**GET** `/chat`

Retrieve all chats for authenticated user.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "participants": [
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
          "name": "Sarah - Backend Engineer",
          "profilePicture": "https://cloudinary.com/..."
        }
      ],
      "lastMessage": {
        "content": "Thanks for the help!",
        "timestamp": "2024-01-15T14:30:00.000Z"
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

---

### Get Chat Messages

**GET** `/chat/:chatId/messages`

Retrieve messages for a specific chat.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Messages per page (default: 50)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "sender": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Sarah - Backend Engineer",
        "profilePicture": "https://cloudinary.com/..."
      },
      "content": "Hello! How can I help you?",
      "type": "text",
      "isUnsent": false,
      "reactions": {
        "👍": ["64a1b2c3d4e5f6g7h8i9j0k1"]
      },
      "readBy": ["64a1b2c3d4e5f6g7h8i9j0k1"],
      "createdAt": "2024-01-15T14:25:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "hasMore": true
  }
}
```

---

### Send Message

**POST** `/chat/:chatId/message`

Send a message in a chat.

**Request Body:**
```json
{
  "content": "Hello! I have a question about your artifact.",
  "type": "text"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "sender": "64a1b2c3d4e5f6g7h8i9j0k1",
    "content": "Hello! I have a question about your artifact.",
    "type": "text",
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

---

## 💼 Job Endpoints

### Get All Jobs

**GET** `/jobs`

Retrieve paginated list of jobs.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): "open", "closed", "in_progress"
- `budget` (string): "0-1000", "1000-5000", "5000+"
- `skills` (string): Comma-separated skills

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Full Stack Developer Needed",
      "description": "Looking for an experienced full stack developer...",
      "budget": 5000,
      "budgetType": "fixed",
      "skills": ["React", "Node.js", "MongoDB"],
      "duration": "3 months",
      "status": "open",
      "client": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Tech Startup Inc",
        "profilePicture": "https://cloudinary.com/..."
      },
      "proposalsCount": 12,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "currentPage": 1,
    "totalPages": 3
  }
}
```

---

### Create Job

**POST** `/jobs`

Post a new job (requires patron role).

**Request Body:**
```json
{
  "title": "Full Stack Developer Needed",
  "description": "Looking for an experienced full stack developer to build a SaaS platform...",
  "budget": 5000,
  "budgetType": "fixed",
  "skills": ["React", "Node.js", "MongoDB"],
  "duration": "3 months",
  "milestones": [
    {
      "title": "Phase 1: Design",
      "amount": 1500,
      "dueDate": "2024-02-15"
    },
    {
      "title": "Phase 2: Development",
      "amount": 3000,
      "dueDate": "2024-03-30"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Job posted successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Full Stack Developer Needed",
    "status": "open",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### Submit Proposal

**POST** `/jobs/:jobId/proposals`

Submit a proposal for a job.

**Request Body:**
```json
{
  "coverLetter": "I am an experienced full stack developer with 5 years of experience...",
  "proposedBudget": 4500,
  "estimatedDuration": "2.5 months",
  "portfolio": [
    "https://example.com/project1",
    "https://example.com/project2"
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Proposal submitted successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "job": "64a1b2c3d4e5f6g7h8i9j0k1",
    "craftsman": "64a1b2c3d4e5f6g7h8i9j0k1",
    "status": "pending",
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 🏆 Challenge Endpoints

### Get Active Challenges

**GET** `/challenges`

Retrieve list of active challenges.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "title": "Build a Real-time Chat App",
      "description": "Create a fully functional real-time chat application...",
      "difficulty": "intermediate",
      "currentPhase": "submission",
      "phases": {
        "registration": {
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-01-07T23:59:59.000Z"
        },
        "submission": {
          "startDate": "2024-01-08T00:00:00.000Z",
          "endDate": "2024-01-21T23:59:59.000Z"
        },
        "judging": {
          "startDate": "2024-01-22T00:00:00.000Z",
          "endDate": "2024-01-28T23:59:59.000Z"
        }
      },
      "prizes": {
        "first": 1000,
        "second": 500,
        "third": 250
      },
      "participantsCount": 45,
      "submissionsCount": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Register for Challenge

**POST** `/challenges/:challengeId/register`

Register for a challenge.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully registered for challenge"
}
```

---

### Submit Challenge Entry

**POST** `/challenges/:challengeId/submit`

Submit your challenge entry.

**Headers:**
```http
Content-Type: multipart/form-data
```

**Form Data:**
- `description` (string): Submission description
- `githubLink` (string): GitHub repository URL
- `liveLink` (string): Live demo URL
- `screenshot` (file): Screenshot/preview
- `sourceCode` (file): Source code ZIP

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Submission uploaded successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "challenge": "64a1b2c3d4e5f6g7h8i9j0k1",
    "participant": "64a1b2c3d4e5f6g7h8i9j0k1",
    "status": "submitted",
    "submittedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

---

## 📊 Analytics Endpoints

### Track View

**POST** `/artifact/:id/view`

Increment view count for an artifact.

**Response:** `200 OK`
```json
{
  "success": true,
  "counted": true
}
```

---

### Track Download

**POST** `/artifact/:id/download`

Increment download count for an artifact.

**Response:** `200 OK`
```json
{
  "success": true,
  "counted": true
}
```

---

### Track Impressions

**POST** `/artifact/impressions`

Batch track impressions for multiple artifacts.

**Request Body:**
```json
{
  "artifactIds": [
    "64a1b2c3d4e5f6g7h8i9j0k1",
    "64a1b2c3d4e5f6g7h8i9j0k2",
    "64a1b2c3d4e5f6g7h8i9j0k3"
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "counted": true
}
```

---

## 🔔 Notification Endpoints

### Get Notifications

**GET** `/notifications`

Retrieve user notifications.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `unreadOnly` (boolean): Filter unread only

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "type": "like",
      "title": "New Like",
      "message": "Sarah - Backend Engineer liked your artifact",
      "actor": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Sarah - Backend Engineer",
        "profilePicture": "https://cloudinary.com/..."
      },
      "targetId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "targetType": "Artifact",
      "read": false,
      "createdAt": "2024-01-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "hasMore": true
  }
}
```

---

### Mark as Read

**PUT** `/notifications/:id/read`

Mark notification as read.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Mark All as Read

**PUT** `/notifications/read-all`

Mark all notifications as read.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation failed
- `423 Locked`: Account locked
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## 🔒 Rate Limiting

### Limits

- **Global**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 attempts per 15 minutes per IP
- **Upload endpoints**: 10 uploads per hour per user
- **API endpoints**: 1000 requests per hour per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

---

## 📝 Best Practices

### 1. Always Include CSRF Token
```javascript
headers: {
  'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
}
```

### 2. Handle Token Refresh
```javascript
// Intercept 401 responses
if (response.status === 401) {
  await refreshToken();
  // Retry original request
}
```

### 3. Implement Retry Logic
```javascript
// Retry on network errors
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  try {
    return await fetch(url);
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await delay(1000 * Math.pow(2, i));
  }
}
```

### 4. Use Pagination
```javascript
// Always paginate large datasets
const page = 1;
const limit = 20;
const url = `/artifacts?page=${page}&limit=${limit}`;
```

---

**API Version:** v1  
**Last Updated:** January 2024  
**Base URL:** `https://api.codalina.com/api/v1`
