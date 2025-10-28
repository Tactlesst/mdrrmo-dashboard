# MDRRMO Dashboard

A comprehensive Municipal Disaster Risk Reduction and Management Office (MDRRMO) dashboard system built with Next.js, featuring real-time emergency response management, live status tracking, and patient care reporting.

[![Netlify Status](https://api.netlify.com/api/v1/badges/2e6f5f05-46f6-4ee6-a776-b300a7607c8e/deploy-status)](https://app.netlify.com/projects/roadacci/deploys)

## 📚 Documentation

### Quick Access
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation index
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference guide
- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - System architecture overview

### Key Features Documentation
- **[SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md)** - Security features and best practices
- **[VALIDATION_SUMMARY.md](./VALIDATION_SUMMARY.md)** - API validation and error handling
- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)** - Performance optimizations (3-5x faster)
- **[CHAT_FUNCTIONALITY_UPDATE.md](./CHAT_FUNCTIONALITY_UPDATE.md)** - Real-time chat system
- **[LIVE_STATUS_SYSTEM.md](./LIVE_STATUS_SYSTEM.md)** - Live user status tracking

## ✨ Key Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 👥 **Live Status Tracking** - Real-time online/offline user status
- 💬 **Real-Time Chat** - Instant messaging between admins and responders
- 📋 **PCR Forms** - Patient Care Report forms with auto-population
- 🗺️ **Interactive Maps** - Leaflet-based emergency location tracking
- 📊 **Analytics Dashboard** - Response time analytics and reporting
- ⚡ **High Performance** - 3-5x faster load times with optimizations
- 🔒 **Rate Limiting** - Protection against brute force attacks

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL
- **Maps**: Leaflet
- **Charts**: Victory
- **Authentication**: JWT + bcrypt
- **Deployment**: Netlify

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# DATABASE_URL=your_postgresql_connection_string
# JWT_SECRET=your_secret_key

# Run database migrations
psql -U username -d database -f database-migration-add-indexes.sql
psql -U username -d database -f database-migration-add-chat.sql

# Start development server
npm run dev
```

## 🔒 Security Features

- ✅ Bcrypt password hashing
- ✅ JWT token authentication
- ✅ HttpOnly secure cookies
- ✅ Rate limiting (5 attempts per 15 min)
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection

## 📈 Performance

- **Dashboard Load**: 3-5x faster (0.5-1.5s)
- **API Calls**: Parallel execution
- **Database**: Optimized with indexes (4-5x faster)
- **Images**: Optimized and lazy-loaded

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn-pages-router)
- [Project Documentation Index](./DOCUMENTATION_INDEX.md)

## 🤝 Contributing

For detailed information about the system architecture, features, and implementation details, please refer to the documentation files listed above.

## 📄 License

This project is part of the MDRRMO Dashboard system.

---

**For complete documentation, start with [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)**
