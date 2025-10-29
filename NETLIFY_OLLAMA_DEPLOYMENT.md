# Deploying MDRRMO Dashboard with Ollama (Netlify + Cloud Server)

## Architecture Overview

Since Netlify cannot run Ollama (it's serverless), we use a **hybrid architecture**:

```
┌─────────────────────┐
│   User Browser      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Netlify           │  ← Your Next.js App (FREE)
│   (Next.js App)     │
└──────────┬──────────┘
           │
           │ HTTPS/VPN
           ▼
┌─────────────────────┐
│   Cloud Server      │  ← Ollama + Llama 3.2 (~$50/month)
│   (DigitalOcean/    │
│    AWS/GCP)         │
└─────────────────────┘
```

## Why This Architecture?

### Netlify Limitations
- ❌ No persistent processes (Ollama needs to run 24/7)
- ❌ No GPU/high RAM (Ollama needs 4-8GB minimum)
- ❌ Serverless functions timeout after 10 seconds
- ❌ Cannot install custom software

### Solution
- ✅ **Netlify**: Hosts your Next.js app (free tier)
- ✅ **Cloud Server**: Runs Ollama + Llama 3.2 (paid)
- ✅ **Communication**: App calls Ollama server via HTTPS

## Step-by-Step Deployment

### Part 1: Deploy Next.js App to Netlify (Current Setup)

Your app is already on Netlify! Just add environment variables.

#### 1. Add Environment Variables in Netlify

Go to: **Netlify Dashboard → Site Settings → Environment Variables**

Add:
```env
# Ollama Configuration
OLLAMA_HOST=http://YOUR_SERVER_IP:11434
OLLAMA_MODEL=llama3.2
OLLAMA_FALLBACK=true

# Existing variables
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 2. Redeploy
Netlify will automatically redeploy with new environment variables.

---

### Part 2: Set Up Ollama Server

Choose a cloud provider and follow these steps:

## Option A: DigitalOcean (Recommended - Easiest)

### 1. Create Droplet

**Via DigitalOcean Dashboard:**
1. Go to: https://cloud.digitalocean.com/droplets/new
2. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU Options**: Regular Intel - $48/month
     - 8GB RAM / 4 vCPUs / 160GB SSD
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
3. Click **Create Droplet**

### 2. Connect to Server

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP
```

### 3. Install Ollama

```bash
# Update system
apt update && apt upgrade -y

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version
```

### 4. Download Model

```bash
# Pull Llama 3.2 model
ollama pull llama3.2

# Verify model is installed
ollama list
```

### 5. Configure Ollama for Network Access

```bash
# Create systemd override directory
mkdir -p /etc/systemd/system/ollama.service.d/

# Create override file
cat > /etc/systemd/system/ollama.service.d/override.conf << EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
EOF

# Reload systemd and restart Ollama
systemctl daemon-reload
systemctl restart ollama

# Verify it's running
systemctl status ollama
```

### 6. Configure Firewall

```bash
# Install UFW (if not installed)
apt install ufw -y

# Allow SSH (important - don't lock yourself out!)
ufw allow 22/tcp

# Allow Ollama port from specific IP (your Netlify app)
# Note: Netlify uses dynamic IPs, so we'll secure differently
ufw allow 11434/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 7. Test Ollama

```bash
# Test locally
curl http://localhost:11434/api/tags

# Test from your computer (replace YOUR_DROPLET_IP)
curl http://YOUR_DROPLET_IP:11434/api/tags
```

---

## Option B: AWS EC2

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: `t3.large` (2 vCPU, 8GB RAM)
   - **Storage**: 20GB gp3
3. Configure Security Group:
   - Allow SSH (port 22) from your IP
   - Allow Custom TCP (port 11434) from anywhere (we'll restrict later)
4. Launch and download key pair

### 2. Connect and Install

```bash
# Connect
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Follow same installation steps as DigitalOcean (steps 3-7)
```

---

## Option C: Google Cloud Platform

### 1. Create VM Instance

1. Go to: GCP Console → Compute Engine → VM Instances
2. Click **Create Instance**
3. Configure:
   - **Machine Type**: n2-standard-2 (2 vCPU, 8GB RAM)
   - **Boot Disk**: Ubuntu 22.04 LTS, 20GB
   - **Firewall**: Allow HTTP/HTTPS traffic
4. Create

### 2. Connect and Install

```bash
# Connect via browser SSH or:
gcloud compute ssh YOUR_INSTANCE_NAME

# Follow same installation steps as DigitalOcean (steps 3-7)
```

---

## Security Configuration

### Option 1: IP Whitelisting (Basic)

Restrict Ollama access to specific IPs:

```bash
# On your Ollama server
ufw delete allow 11434/tcp
ufw allow from YOUR_APP_SERVER_IP to any port 11434
```

**Problem**: Netlify uses dynamic IPs, so this is difficult.

### Option 2: VPN (Recommended)

Set up a VPN between Netlify and your Ollama server:

1. **Use Tailscale** (easiest):
   ```bash
   # On Ollama server
   curl -fsSL https://tailscale.com/install.sh | sh
   tailscale up
   ```

2. Update Netlify environment:
   ```env
   OLLAMA_HOST=http://100.x.x.x:11434  # Tailscale IP
   ```

### Option 3: Reverse Proxy with Authentication

Add Nginx with basic auth:

```bash
# Install Nginx
apt install nginx -y

# Configure Nginx
cat > /etc/nginx/sites-available/ollama << EOF
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://localhost:11434;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Create password file
apt install apache2-utils -y
htpasswd -c /etc/nginx/.htpasswd ollama_user

# Enable site
ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Update Netlify:
```env
OLLAMA_HOST=http://ollama_user:password@YOUR_SERVER_IP
```

### Option 4: SSL/TLS with Let's Encrypt (Production)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate (requires domain name)
certbot --nginx -d ollama.yourdomain.com

# Nginx will be automatically configured for HTTPS
```

Update Netlify:
```env
OLLAMA_HOST=https://ollama.yourdomain.com
```

---

## Update Your Netlify App

### 1. Set Environment Variable

In Netlify Dashboard:
```env
OLLAMA_HOST=http://YOUR_SERVER_IP:11434
# Or with auth:
OLLAMA_HOST=http://user:pass@YOUR_SERVER_IP
# Or with SSL:
OLLAMA_HOST=https://ollama.yourdomain.com
```

### 2. Test Connection

After redeployment, test:
```
https://your-app.netlify.app/api/ollama/health
```

Should return:
```json
{
  "status": "healthy",
  "defaultModel": "llama3.2",
  "modelInstalled": true
}
```

---

## Cost Breakdown

### Monthly Costs

| Component | Provider | Cost |
|-----------|----------|------|
| **Next.js App** | Netlify | $0 (Free tier) |
| **Ollama Server** | DigitalOcean | $48/month |
| **Ollama Server** | AWS EC2 t3.large | ~$60/month |
| **Ollama Server** | Google Cloud n2-standard-2 | ~$50/month |
| **Domain (optional)** | Namecheap/Google | $12/year |
| **SSL Certificate** | Let's Encrypt | Free |

**Total: ~$50/month** (plus your existing database costs)

### Cost Optimization

1. **Use Reserved Instances** (AWS/GCP) - Save 30-50%
2. **Auto-shutdown during off-hours** - Save 50%
3. **Use spot instances** (AWS) - Save 70% (but can be interrupted)

---

## Monitoring & Maintenance

### Health Monitoring

Set up a cron job to check Ollama health:

```bash
# On Ollama server
crontab -e

# Add:
*/5 * * * * curl -f http://localhost:11434/api/tags || systemctl restart ollama
```

### Log Monitoring

```bash
# View Ollama logs
journalctl -u ollama -f

# View Nginx logs (if using)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Resource Monitoring

```bash
# Check RAM usage
free -h

# Check CPU usage
top

# Check disk space
df -h
```

### Automatic Updates

```bash
# Create update script
cat > /root/update-ollama.sh << 'EOF'
#!/bin/bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
systemctl restart ollama
EOF

chmod +x /root/update-ollama.sh

# Run monthly
crontab -e
# Add:
0 2 1 * * /root/update-ollama.sh
```

---

## Troubleshooting

### Issue: "Service unavailable" in Netlify app

**Check:**
1. Is Ollama server running?
   ```bash
   systemctl status ollama
   ```

2. Can you reach it from outside?
   ```bash
   curl http://YOUR_SERVER_IP:11434/api/tags
   ```

3. Is firewall blocking?
   ```bash
   ufw status
   ```

### Issue: Slow response times

**Solutions:**
1. Use smaller model: `ollama pull llama3.2` (instead of mistral)
2. Upgrade server RAM
3. Add caching in your Next.js app

### Issue: High costs

**Solutions:**
1. Auto-shutdown during off-hours
2. Use spot/preemptible instances
3. Consider serverless alternatives for low usage

---

## Alternative: Fully Serverless (No Ollama)

If $50/month is too expensive, consider:

### Use OpenAI API (Not Private)
```bash
npm install openai
```

Update `.env` in Netlify:
```env
OPENAI_API_KEY=your_api_key
USE_OPENAI=true
```

**Cost**: ~$0.03 per 1K tokens (~$10-30/month for moderate use)

**Trade-off**: ❌ Data sent to OpenAI (not private)

---

## Conclusion

**Recommended Setup:**
- ✅ **Netlify**: Host your Next.js app (free)
- ✅ **DigitalOcean Droplet**: Run Ollama ($48/month)
- ✅ **Tailscale VPN**: Secure connection (free)
- ✅ **Let's Encrypt SSL**: Encrypted traffic (free)

**Total Cost**: ~$50/month for complete privacy and control

This gives you the best balance of:
- Easy deployment (Netlify)
- Data privacy (self-hosted AI)
- Reasonable cost
- Scalability

---

## Quick Reference Commands

```bash
# Check Ollama status
systemctl status ollama

# Restart Ollama
systemctl restart ollama

# View logs
journalctl -u ollama -f

# Test API
curl http://localhost:11434/api/tags

# Update Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull new model
ollama pull llama3.2
```
