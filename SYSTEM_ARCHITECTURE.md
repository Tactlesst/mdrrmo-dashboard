# MDRRMO Dashboard - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React Components)                            │
│  ├── Dashboard                                                   │
│  ├── Map Display (Leaflet)                                      │
│  ├── PCR Forms                                                   │
│  ├── User Management                                             │
│  ├── Chat Interface                                              │
│  └── Live Status Display                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS/TLS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     API LAYER (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/login              - Authentication                        │
│  /api/users/*            - User Management                       │
│  /api/admins/*           - Admin Operations                      │
│  /api/responders/*       - Responder Operations                  │
│  /api/pcr/*              - PCR Forms                             │
│  /api/alerts/*           - Alert Management                      │
│  /api/chat/*             - Chat Messaging                        │
│  /api/notifications/*    - Notifications                         │
│  /api/heartbeat          - Session Management                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ SQL Queries (Parameterized)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    DATABASE LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                             │
│  ├── User Tables (admins, responders, users)                    │
│  ├── Session Tables (admin_sessions, responder_sessions)        │
│  ├── Data Tables (pcr_forms, alerts, notifications)             │
│  ├── Audit Tables (security_logs)                               │
│  └── Indexes (Performance optimization)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /api/login
     │    {email, password}
     ▼
┌─────────────────┐
│  Login API      │
│  (/api/login)   │
└────┬────────────┘
     │
     │ 2. Validate credentials
     │    - Check email format
     │    - Verify bcrypt hash
     │    - Check rate limit
     ▼
┌─────────────────┐
│   Database      │
│   (admins/      │
│    responders)  │
└────┬────────────┘
     │
     │ 3. Create session
     │    - Generate JWT token
     │    - Store in sessions table
     ▼
┌─────────────────┐
│  Response       │
│  - Set HttpOnly │
│    cookie       │
│  - Return user  │
│    data         │
└────┬────────────┘
     │
     │ 4. Client stores token
     ▼
┌──────────┐
│  Client  │
│  (Logged │
│   In)    │
└──────────┘
```

### 2. Live Status System Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    HEARTBEAT CYCLE                            │
└──────────────────────────────────────────────────────────────┘

Every 30 seconds:

Client (useHeartbeat hook)
     │
     │ POST /api/heartbeat
     │ {token in cookie}
     ▼
API (/api/heartbeat)
     │
     │ 1. Verify JWT token
     │ 2. Extract user email
     ▼
Database (admin_sessions)
     │
     │ UPDATE last_active_at = NOW()
     │ WHERE admin_email = ?
     ▼
Response (200 OK)


┌──────────────────────────────────────────────────────────────┐
│                    STATUS CHECK CYCLE                         │
└──────────────────────────────────────────────────────────────┘

Every 5 seconds:

Client (OnlineAdminsList)
     │
     │ GET /api/admins/status
     ▼
API (/api/admins/status)
     │
     │ 1. Cleanup inactive sessions
     │    (last_active_at > 2 min)
     │ 2. Fetch all users with status
     ▼
Database
     │
     │ SELECT users with sessions
     │ WHERE last_active_at > NOW() - INTERVAL '2 minutes'
     ▼
Response
     │
     │ {users: [{id, name, status: 'online/offline'}]}
     ▼
Client
     │
     │ Update UI with status
     │ - Green pulse for online
     │ - Gray for offline
     │ - Play sound on new online
     └─
```

### 3. Chat Message Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    SEND MESSAGE                               │
└──────────────────────────────────────────────────────────────┘

User types message
     │
     │ POST /api/notifications/create
     │ {
     │   account_id: recipient_id,
     │   account_type: 'admin',
     │   sender_id: current_user_id,
     │   sender_type: 'chat',
     │   message: 'Hello!'
     │ }
     ▼
API (/api/notifications/create)
     │
     │ 1. Validate input
     │ 2. Check message length
     │ 3. Sanitize content
     ▼
Database (notifications)
     │
     │ INSERT INTO notifications
     │ VALUES (...)
     ▼
Response (201 Created)
     │
     │ Trigger immediate refresh
     ▼
Client refreshes chat


┌──────────────────────────────────────────────────────────────┐
│                    RECEIVE MESSAGES                           │
└──────────────────────────────────────────────────────────────┘

Every 3 seconds (auto-refresh):

Client (fetchChatMessages)
     │
     │ GET /api/chat/messages
     │ ?userId=1&otherUserId=2
     │ &userType=admin&otherUserType=responder
     ▼
API (/api/chat/messages)
     │
     │ 1. Validate parameters
     │ 2. Verify user types
     ▼
Database (notifications)
     │
     │ SELECT * FROM notifications
     │ WHERE sender_type = 'chat'
     │   AND ((sender_id = 1 AND account_id = 2)
     │        OR (sender_id = 2 AND account_id = 1))
     │ ORDER BY created_at ASC
     ▼
Response
     │
     │ {messages: [{id, sender_id, message, ...}]}
     ▼
Client
     │
     │ Display messages
     │ - Your messages: right, blue
     │ - Their messages: left, gray
     └─
```

### 4. PCR Form Auto-Population Flow

```
┌──────────────────────────────────────────────────────────────┐
│                PCR FORM AUTO-POPULATION                       │
└──────────────────────────────────────────────────────────────┘

User selects case type
     │
     │ onChange event
     ▼
Fetch matching alerts
     │
     │ GET /api/alerts?type=Fire
     ▼
API returns alerts
     │
     │ [{id, type, address, created_at, responded_at}]
     ▼
Auto-select most recent alert
     │
     │ alerts[0]
     ▼
Extract timestamp
     │
     │ Priority:
     │ 1. responded_at (if exists)
     │ 2. created_at (fallback)
     ▼
Convert to 12-hour format
     │
     │ extractTimeFromTimestamp()
     │ "2025-10-28 14:30:00" → {time: "02:30", period: "PM"}
     ▼
Populate form fields
     │
     │ setFormData({
     │   timeCall: "02:30",
     │   timeCallPeriod: "PM",
     │   location: alert.address,
     │   chiefComplaints: alert.type
     │ })
     ▼
Form ready for user input
     │
     │ User can:
     │ - Override auto-populated values
     │ - Enter timeArrivedScene manually
     │ - Complete remaining fields
     └─
```

---

## 🔐 Security Architecture

### Layer 1: Network Security
```
Client ←→ HTTPS/TLS ←→ Server
         (Encrypted)
```

### Layer 2: Authentication
```
Request → JWT Verification → Rate Limiting → API Handler
          ↓                   ↓
          Reject if invalid   Reject if exceeded
```

### Layer 3: Authorization
```
API Handler → Check User Role → Check Permissions → Execute
              ↓                 ↓
              Admin/Responder   Resource access rights
```

### Layer 4: Data Protection
```
User Input → Validation → Sanitization → Parameterized Query → Database
             ↓            ↓               ↓
             Type check   XSS prevention  SQL injection prevention
```

---

## 📊 Database Schema Relationships

```
┌─────────────┐
│   admins    │
│─────────────│
│ id (PK)     │
│ email       │◄─────────┐
│ password    │          │
│ full_name   │          │
└─────────────┘          │
                         │
                         │
┌─────────────────────┐  │
│  admin_sessions     │  │
│─────────────────────│  │
│ id (PK)             │  │
│ admin_email (FK)    │──┘
│ is_active           │
│ last_active_at      │
│ created_at          │
└─────────────────────┘


┌─────────────┐
│ responders  │
│─────────────│
│ id (PK)     │◄─────────┐
│ email       │          │
│ password    │          │
│ full_name   │          │
└─────────────┘          │
                         │
┌─────────────────────┐  │
│ responder_sessions  │  │
│─────────────────────│  │
│ id (PK)             │  │
│ responder_id (FK)   │──┘
│ is_active           │
│ last_active_at      │
│ status              │
└─────────────────────┘


┌─────────────┐
│   alerts    │
│─────────────│
│ id (PK)     │◄─────────┐
│ type        │          │
│ address     │          │
│ created_at  │          │
│ responded_at│          │
└─────────────┘          │
                         │
┌─────────────────────┐  │
│    pcr_forms        │  │
│─────────────────────│  │
│ id (PK)             │  │
│ alert_id (FK)       │──┘
│ full_form (JSONB)   │
│ created_at          │
└─────────────────────┘


┌─────────────────────┐
│   notifications     │
│─────────────────────│
│ id (PK)             │
│ account_id          │
│ account_type        │
│ sender_id           │
│ sender_type         │  ← 'chat' for chat messages
│ sender_name         │
│ message             │
│ read                │
│ created_at          │
└─────────────────────┘
```

---

## 🔄 Real-Time Update Mechanisms

### 1. Polling Strategy
```
Component          Interval    Purpose
─────────────────────────────────────────────────
useHeartbeat       30s         Keep session alive
OnlineAdminsList   5s          Update user status
Chat Messages      3s          Fetch new messages
Dashboard Alerts   10s         Refresh alert data
```

### 2. State Management
```
React Component State
     │
     ├── Local State (useState)
     │   └── Form inputs, UI toggles
     │
     ├── Effect Hooks (useEffect)
     │   └── API polling, cleanup
     │
     └── Custom Hooks
         ├── useHeartbeat (session management)
         └── useAuth (authentication state)
```

---

## ⚡ Performance Optimization Strategy

### 1. API Call Optimization
```
BEFORE (Sequential):
─────────────────────
Request 1 ─────► Wait ─────► Complete (500ms)
                              │
                              ▼
                Request 2 ─────► Wait ─────► Complete (400ms)
                                              │
                                              ▼
                                Request 3 ─────► Wait ─────► Complete (300ms)
                                                              │
Total Time: 1200ms                                           ▼


AFTER (Parallel):
─────────────────
Request 1 ─────► Wait ─────► Complete (500ms) ─┐
Request 2 ─────► Wait ─────► Complete (400ms) ─┼─► All Done
Request 3 ─────► Wait ─────► Complete (300ms) ─┘
                                                 │
Total Time: 500ms (longest request)             ▼
```

### 2. Database Optimization
```
Without Indexes:
─────────────────
Query → Full Table Scan → Filter → Return
        (Slow: 200-500ms)


With Indexes:
─────────────
Query → Index Lookup → Return
        (Fast: 50-100ms)
```

### 3. Image Optimization
```
Original Image (2MB)
     │
     ├─► Compression (WebP format)
     │   └─► 200KB (10x smaller)
     │
     ├─► Lazy Loading
     │   └─► Load only when visible
     │
     └─► Responsive Sizes
         └─► Serve appropriate size per device
```

---

## 🎯 Component Architecture

### Page Structure
```
pages/
├── index.js                    (Landing/Login)
├── dashboard.js                (Main Dashboard)
├── responder-dashboard.js      (Responder View)
│
└── api/
    ├── login.js                (Authentication)
    ├── heartbeat.js            (Session management)
    ├── users/
    │   ├── index.js            (CRUD operations)
    │   ├── add.js
    │   ├── update.js
    │   └── delete.js
    ├── admins/
    │   └── status.js           (Live status)
    ├── chat/
    │   └── messages.js         (Chat history)
    ├── notifications/
    │   └── create.js           (Send message)
    ├── pcr/
    │   └── index.js            (PCR forms)
    └── alerts/
        ├── index.js            (Alert management)
        └── locations.js        (Alert locations)
```

### Component Hierarchy
```
DashboardContent
├── MapDisplay
│   ├── Leaflet Map
│   ├── Alert Markers
│   └── Location Tracking
│
├── OnlineAdminsList
│   ├── Admin Cards
│   ├── Responder Cards
│   ├── Chat Modal
│   └── Status Indicators
│
├── PCRForm
│   ├── Patient Info Section
│   ├── Timing Section (Auto-populated)
│   ├── Vital Signs Section
│   └── Treatment Section
│
├── Users
│   ├── User Table
│   ├── Add User Modal
│   └── Edit User Modal
│
├── Reports
│   ├── Analytics Dashboard
│   ├── Charts (Victory)
│   └── Export Functions
│
└── Notifications
    ├── Notification List
    └── Read/Unread Status
```

---

## 🔧 Technology Stack

### Frontend
```
Framework:       Next.js (React)
Styling:         Tailwind CSS
Maps:            Leaflet
Charts:          Victory
Icons:           Lucide React
State:           React Hooks
```

### Backend
```
Runtime:         Node.js
Framework:       Next.js API Routes
Database:        PostgreSQL
Authentication:  JWT + bcrypt
Session:         Cookie-based
```

### DevOps
```
Deployment:      Netlify
Version Control: Git
Database Host:   PostgreSQL (cloud)
```

---

## 📈 Scalability Considerations

### Current Architecture
- ✅ Supports multiple concurrent users
- ✅ Efficient database queries with indexes
- ✅ Stateless API (JWT-based)
- ✅ Horizontal scaling ready

### Future Enhancements
- 🔄 WebSocket for real-time updates (replace polling)
- 🔄 Redis for session caching
- 🔄 CDN for static assets
- 🔄 Load balancer for multiple instances
- 🔄 Database read replicas

---

## 🔍 Monitoring & Logging

### Application Logs
```
Console Logs:     Development debugging
Error Logs:       API errors, exceptions
Security Logs:    Login attempts, suspicious activity
Audit Logs:       Data modifications, admin actions
```

### Performance Metrics
```
API Response Time:    < 500ms
Database Query Time:  < 100ms
Page Load Time:       < 2s
Lighthouse Score:     > 90
```

---

## 📝 Development Workflow

```
1. Local Development
   ├── npm run dev
   ├── Test features
   └── Debug in browser

2. Code Review
   ├── Check security
   ├── Verify performance
   └── Test edge cases

3. Testing
   ├── Manual testing
   ├── API testing
   └── Performance testing

4. Deployment
   ├── Build production
   ├── Deploy to Netlify
   └── Monitor logs

5. Monitoring
   ├── Check performance
   ├── Review logs
   └── User feedback
```

---

## 🎓 Key Design Decisions

### 1. Polling vs WebSockets
**Decision**: Polling  
**Reason**: Simpler implementation, adequate for current scale  
**Future**: Consider WebSockets for larger scale

### 2. JWT in Cookies vs LocalStorage
**Decision**: HttpOnly Cookies  
**Reason**: Better security (XSS protection)

### 3. Monolithic vs Microservices
**Decision**: Monolithic (Next.js)  
**Reason**: Simpler deployment, adequate for current needs

### 4. SQL vs NoSQL
**Decision**: PostgreSQL (SQL)  
**Reason**: Relational data, ACID compliance, complex queries

### 5. Client-Side vs Server-Side Rendering
**Decision**: Hybrid (Next.js)  
**Reason**: SEO benefits + dynamic content

---

**Last Updated**: October 28, 2025  
**Version**: 1.0  
**Architecture Type**: Monolithic Full-Stack Application

**For implementation details, see [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**
