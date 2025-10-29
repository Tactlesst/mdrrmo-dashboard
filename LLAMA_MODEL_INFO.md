# Llama 3.2 Model Information

## Overview

**Llama 3.2** is a Large Language Model (LLM) used in this project for automated generation of professional medical narratives from Patient Care Report (PCR) form data.

## Model Specifications

### Basic Information
- **Model Name**: Llama 3.2
- **Developer**: Meta AI (Facebook)
- **Type**: Large Language Model (LLM)
- **Category**: Generative AI / Natural Language Processing
- **Architecture**: Transformer-based neural network
- **Parameters**: 3 billion (3B)
- **License**: Llama 3 Community License (Open Source)
- **Release Year**: 2024

### Technical Details
- **Model Family**: Llama 3.x series
- **Training Method**: 
  - Supervised Fine-Tuning (SFT)
  - Reinforcement Learning from Human Feedback (RLHF)
- **Context Window**: 8,192 tokens
- **Supported Languages**: Multilingual (optimized for English)

## Classification

```
Artificial Intelligence
  └── Machine Learning
      └── Deep Learning
          └── Natural Language Processing (NLP)
              └── Large Language Model (LLM)
                  └── Llama 3.2
```

## Use Case in This Project

### Purpose
Generate professional, concise medical narratives from structured PCR form data including:
- Patient information
- Vital signs
- Chief complaints
- Timeline of events
- Interventions and treatments
- Disposition

### Deployment Method
- **Platform**: Ollama (self-hosted AI runtime)
- **Hosting**: On-premises / Self-hosted
- **Privacy**: 100% private - no external API calls
- **Integration**: Node.js via Ollama npm package

## System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 2GB for model
- **CPU**: Modern multi-core processor
- **OS**: Windows, Linux, or macOS

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 10GB free space
- **CPU**: 8+ cores
- **GPU**: Optional (for faster inference)

## Performance Characteristics

| Metric | Value |
|--------|-------|
| **Inference Speed** | 2-5 seconds per narrative |
| **Quality** | Professional medical-grade text |
| **Consistency** | High (temperature: 0.3) |
| **Token Limit** | 500 tokens per generation |

## Alternative Models

| Model | Developer | Parameters | Speed | Quality | RAM |
|-------|-----------|------------|-------|---------|-----|
| **Llama 3.2** | Meta AI | 3B | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | 4GB |
| **Phi-3** | Microsoft | 3.8B | ⚡⚡ Medium | ⭐⭐⭐⭐ Excellent | 6GB |
| **Mistral** | Mistral AI | 7B | ⚡ Slower | ⭐⭐⭐⭐⭐ Superior | 8GB |
| **Llama 3.1** | Meta AI | 8B | ⚡ Slower | ⭐⭐⭐⭐⭐ Superior | 10GB |

## Privacy & Compliance

### Data Privacy Features
- ✅ **On-premises deployment** - All data stays on your infrastructure
- ✅ **No external API calls** - No data sent to third parties
- ✅ **Self-hosted** - Complete control over the model
- ✅ **HIPAA-friendly** - Suitable for medical data processing
- ✅ **Audit trail** - All operations logged locally

### Compliance
- **HIPAA**: Compatible (when properly deployed)
- **GDPR**: Compliant (data stays local)
- **Data Sovereignty**: Full control

## Deployment Options

### Option 1: Local Development (Current Setup)
```
Your Computer → Ollama → Llama 3.2 → Narrative
```

**Pros:**
- ✅ Complete privacy
- ✅ No network latency
- ✅ Free to use
- ✅ Full control

**Cons:**
- ⚠️ Requires local resources
- ⚠️ Single point of access

### Option 2: Online Server Deployment (Production)

Deploy Ollama and Llama 3.2 on a cloud or dedicated server for team access.

#### Architecture
```
Client Browser → Your Next.js App → Ollama Server → Llama 3.2 → Narrative
```

#### Server Options

**A. Cloud Virtual Machine (VM)**
- **Providers**: AWS EC2, Google Cloud Compute, Azure VM, DigitalOcean
- **Instance Type**: 
  - AWS: `t3.large` or `t3.xlarge`
  - Google Cloud: `n2-standard-2` or `n2-standard-4`
  - Azure: `Standard_D2s_v3` or `Standard_D4s_v3`
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: 20GB SSD

**B. Dedicated Server**
- Your own physical server
- Full control and privacy
- One-time hardware cost

**C. Private Cloud**
- On-premises private cloud
- Maximum security and compliance
- Suitable for healthcare organizations

#### Setup Steps for Online Server

##### 1. Provision Server
```bash
# Example: Ubuntu 22.04 LTS on cloud VM
# Minimum: 2 vCPUs, 8GB RAM, 20GB storage
```

##### 2. Install Ollama on Server
```bash
# SSH into your server
ssh user@your-server-ip

# Install Ollama (Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the model
ollama pull llama3.2
```

##### 3. Configure Ollama for Network Access
```bash
# Allow external connections
export OLLAMA_HOST=0.0.0.0:11434

# Or set permanently in /etc/systemd/system/ollama.service
sudo systemctl edit ollama
```

Add:
```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

```bash
# Restart service
sudo systemctl restart ollama
```

##### 4. Configure Firewall
```bash
# Allow only your application server IP
sudo ufw allow from YOUR_APP_SERVER_IP to any port 11434

# Or use security groups in cloud console
# AWS: Security Groups
# Google Cloud: Firewall Rules
# Azure: Network Security Groups
```

##### 5. Update Your Application
In your `.env.local` or production environment:
```env
OLLAMA_HOST=http://your-server-ip:11434
OLLAMA_MODEL=llama3.2
OLLAMA_FALLBACK=true
```

##### 6. Secure the Connection (Recommended)

**Option A: VPN**
- Connect servers via VPN
- Keep Ollama on private network

**Option B: SSH Tunnel**
```bash
# On your app server
ssh -L 11434:localhost:11434 user@ollama-server
```

**Option C: Reverse Proxy with SSL**
```nginx
# Nginx configuration
server {
    listen 443 ssl;
    server_name ollama.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:11434;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then use:
```env
OLLAMA_HOST=https://ollama.yourdomain.com
```

#### Cost Estimates (Monthly)

| Provider | Instance Type | RAM | vCPU | Cost/Month |
|----------|--------------|-----|------|------------|
| **DigitalOcean** | Basic Droplet | 8GB | 4 | $48 |
| **AWS EC2** | t3.large | 8GB | 2 | ~$60 |
| **Google Cloud** | n2-standard-2 | 8GB | 2 | ~$50 |
| **Azure** | Standard_D2s_v3 | 8GB | 2 | ~$70 |
| **Dedicated Server** | Self-hosted | 16GB | 8 | $100-200 |

*Prices are approximate and vary by region*

#### Security Best Practices for Online Deployment

1. **Network Security**
   - ✅ Use private network/VPN
   - ✅ Restrict firewall to specific IPs
   - ✅ Never expose port 11434 to public internet
   - ✅ Use SSL/TLS for connections

2. **Access Control**
   - ✅ Implement authentication on Ollama endpoint
   - ✅ Use API keys or JWT tokens
   - ✅ Monitor access logs
   - ✅ Set up intrusion detection

3. **Data Protection**
   - ✅ Encrypt data in transit (SSL/TLS)
   - ✅ Encrypt data at rest (disk encryption)
   - ✅ Regular backups
   - ✅ Audit logging

4. **Monitoring**
   - ✅ Set up health checks
   - ✅ Monitor resource usage (CPU, RAM)
   - ✅ Alert on failures
   - ✅ Log all API calls

#### Scaling Considerations

**Single Server** (10-50 concurrent users)
- One Ollama instance
- Simple setup
- Cost-effective

**Load Balanced** (50-200 concurrent users)
- Multiple Ollama instances
- Load balancer in front
- Higher availability

**High Availability** (200+ concurrent users)
- Multiple servers across regions
- Auto-scaling
- Caching layer
- Queue system for requests

## Example Production Architecture

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js App    │  (Your MDRRMO Dashboard)
│  (Netlify/VPS)  │
└────────┬────────┘
         │
         │ HTTPS (Private Network/VPN)
         ▼
┌─────────────────┐
│  Ollama Server  │  (Cloud VM or Dedicated Server)
│  + Llama 3.2    │
└─────────────────┘
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check if Ollama is running
curl http://your-server:11434/api/tags

# Or use your app's health endpoint
curl http://localhost:3000/api/ollama/health
```

### Performance Monitoring
- CPU usage: Should be <80% average
- RAM usage: Monitor for memory leaks
- Response time: Should be <5 seconds
- Error rate: Should be <1%

### Updates
```bash
# Update Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Update model (if new version available)
ollama pull llama3.2
```

## Support & Resources

- **Ollama Documentation**: https://ollama.com/docs
- **Llama Model Card**: https://ollama.com/library/llama3.2
- **Meta AI Research**: https://ai.meta.com/llama/
- **Community**: https://github.com/ollama/ollama

## License Information

### Llama 3 Community License
- ✅ Free for research and commercial use
- ✅ Can modify and distribute
- ⚠️ Subject to Meta's acceptable use policy
- ⚠️ Attribution required

**Full License**: https://llama.meta.com/llama3/license/

## Conclusion

Llama 3.2 provides a powerful, privacy-focused solution for AI narrative generation in medical applications. Whether deployed locally or on an online server, it ensures your sensitive medical data remains under your control while delivering professional-quality automated narratives.

For production deployment on an online server, follow the security best practices outlined above to maintain HIPAA compliance and data privacy.
