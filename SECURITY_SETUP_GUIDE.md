# Security Setup Guide - MDRRMO Dashboard

This guide provides step-by-step instructions for setting up and configuring security features in the MDRRMO Dashboard.

## Prerequisites

- Node.js 16+ installed
- PostgreSQL database
- Basic understanding of environment variables
- SSL certificate (for production)

## Initial Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mdrrmo_db

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Node Environment
NODE_ENV=development

# Session Configuration
SESSION_TIMEOUT=1800000  # 30 minutes in milliseconds
HEARTBEAT_INTERVAL=60000  # 1 minute in milliseconds

# Rate Limiting
MAX_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# CORS (for production)
ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Generate JWT Secret

Generate a secure JWT secret using one of these methods:

**Method 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Method 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Method 3: Online Generator**
Use a trusted password generator to create a 64+ character random string.

### 3. Database Security Setup

#### Create Secure Database User

```sql
-- Create a dedicated database user with limited privileges
CREATE USER mdrrmo_app WITH PASSWORD 'strong-password-here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE mdrrmo_db TO mdrrmo_app;
GRANT USAGE ON SCHEMA public TO mdrrmo_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mdrrmo_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mdrrmo_app;

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM mdrrmo_app;
```

#### Add Security Columns

```sql
-- Add last_activity column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP;

-- Add last_activity column to responders table
ALTER TABLE responders ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP;

-- Create login logs table
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_login_logs_admin_id ON login_logs(admin_id);
CREATE INDEX idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX idx_admins_last_activity ON admins(last_activity);
CREATE INDEX idx_responders_last_activity ON responders(last_activity);
```

## Security Features Configuration

### 1. Password Hashing

Passwords are automatically hashed using bcrypt. To hash existing passwords:

```javascript
// Run this script once to hash existing passwords
const bcrypt = require('bcryptjs');
const pool = require('./lib/db');

async function hashPasswords() {
  const users = await pool.query('SELECT id, password FROM admins WHERE password NOT LIKE \'$2a$%\'');
  
  for (const user of users.rows) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
  }
  
  console.log('Passwords hashed successfully');
}

hashPasswords();
```

### 2. Rate Limiting Setup

Rate limiting is automatically enabled. Configure limits in `.env.local`:

```env
MAX_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW=900000  # 15 minutes
```

To manually reset rate limits:
```javascript
import { resetRateLimit } from '@/lib/rateLimit';
resetRateLimit('login:ip:email');
```

### 3. Session Management

Sessions are managed via JWT tokens. Configure timeout:

```env
SESSION_TIMEOUT=1800000  # 30 minutes
```

Set up automatic session cleanup (add to cron or scheduled task):

```bash
# Run every hour
0 * * * * curl -X POST http://localhost:3000/api/sessions/cleanup
```

### 4. HTTPS Configuration (Production)

#### Using Nginx as Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. CORS Configuration

For production, configure CORS in `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

## Monitoring & Maintenance

### 1. Security Logging

Monitor login attempts:
```sql
-- View recent login attempts
SELECT * FROM login_logs ORDER BY created_at DESC LIMIT 100;

-- View failed login attempts
SELECT ip_address, COUNT(*) as attempts
FROM login_logs
WHERE success = false AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY attempts DESC;
```

### 2. Session Monitoring

Check active sessions:
```sql
-- View online users
SELECT id, name, email, last_activity
FROM admins
WHERE last_activity > NOW() - INTERVAL '5 minutes';
```

### 3. Automated Cleanup

Set up cron jobs for maintenance:

```bash
# Clean up old sessions (every hour)
0 * * * * curl -X POST http://localhost:3000/api/sessions/cleanup

# Clean up old logs (daily at 2 AM)
0 2 * * * psql -d mdrrmo_db -c "DELETE FROM login_logs WHERE created_at < NOW() - INTERVAL '90 days'"
```

## Testing Security

### 1. Test Rate Limiting

```bash
# Try multiple failed logins
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### 2. Test Session Timeout

1. Login to the dashboard
2. Wait for session timeout period
3. Try to access a protected page
4. Should be redirected to login

### 3. Test HTTPS Redirect

```bash
curl -I http://yourdomain.com
# Should return 301 redirect to https://
```

## Security Checklist

Before deploying to production:

- [ ] Generate strong JWT secret
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure secure environment variables
- [ ] Set up database user with minimal privileges
- [ ] Hash all existing passwords
- [ ] Configure rate limiting
- [ ] Set up session cleanup cron job
- [ ] Configure CORS for production domain
- [ ] Enable security headers
- [ ] Set up logging and monitoring
- [ ] Test all security features
- [ ] Review and remove development/debug code
- [ ] Set NODE_ENV=production
- [ ] Configure firewall rules
- [ ] Set up regular backups

## Troubleshooting

### Issue: Users getting logged out too quickly
**Solution**: Increase `SESSION_TIMEOUT` in `.env.local`

### Issue: Rate limiting blocking legitimate users
**Solution**: Adjust `MAX_LOGIN_ATTEMPTS` or `RATE_LIMIT_WINDOW`

### Issue: JWT verification failing
**Solution**: Ensure `JWT_SECRET` is consistent across all instances

### Issue: CORS errors in production
**Solution**: Check `ALLOWED_ORIGINS` matches your domain exactly

## Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## Support

For security issues or questions, contact your system administrator or security team.
