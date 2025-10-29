# Ollama Self-Hosted AI Setup Guide

## Overview
This guide will help you set up Ollama for privacy-preserving AI narrative generation in your MDRRMO Dashboard. All medical data stays on your own infrastructure.

## Prerequisites
- Windows Server or Windows 10/11
- Minimum 8GB RAM (16GB recommended)
- 10GB free disk space

## Step 1: Install Ollama

### Windows Installation
1. Download Ollama from: https://ollama.com/download/windows
2. Run the installer: `OllamaSetup.exe`
3. Ollama will install and start automatically as a service

### Verify Installation
Open PowerShell and run:
```powershell
ollama --version
```

## Step 2: Download AI Model

We recommend **Llama 3.2** (3B parameters) for medical narrative generation - it's fast, accurate, and privacy-focused.

```powershell
# Download Llama 3.2 (3B) - Good balance of speed and quality
ollama pull llama3.2

# Alternative: Mistral (7B) - More detailed but slower
# ollama pull mistral

# Alternative: Phi-3 (3.8B) - Microsoft's medical-friendly model
# ollama pull phi3
```

## Step 3: Test Ollama

```powershell
ollama run llama3.2
```

Type a test prompt:
```
Generate a brief medical incident narrative for a patient with chest pain.
```

Press `Ctrl+D` or type `/bye` to exit.

## Step 4: Configure Ollama for Network Access

By default, Ollama only accepts local connections. To allow your Next.js app to connect:

### Option A: Keep Local (Recommended for Development)
No configuration needed. Your Next.js app and Ollama run on the same machine.

### Option B: Allow Network Access (Production)
1. Set environment variable:
```powershell
# Windows - Set permanently
setx OLLAMA_HOST "0.0.0.0:11434"
```

2. Restart Ollama service:
```powershell
# Stop
taskkill /F /IM ollama.exe

# Start (it will auto-restart as a service)
```

## Step 5: Verify Ollama API

Test the API endpoint:
```powershell
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Generate a brief medical narrative.",
  "stream": false
}'
```

## Security Recommendations

### 1. Firewall Configuration
- **Development**: Only allow localhost (127.0.0.1)
- **Production**: Restrict to your application server IP only

### 2. Network Isolation
- Run Ollama on an internal network
- Do NOT expose port 11434 to the public internet
- Use VPN or private network for remote access

### 3. Data Privacy
- ✅ All data stays on your infrastructure
- ✅ No external API calls
- ✅ HIPAA/medical compliance friendly
- ✅ Full control over AI model and data

## Model Recommendations for Medical Narratives

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **llama3.2** | 3B | Fast | Good | General medical narratives (Recommended) |
| **phi3** | 3.8B | Fast | Good | Medical contexts, Microsoft-trained |
| **mistral** | 7B | Medium | Excellent | Detailed, professional narratives |
| **llama3.1** | 8B | Slower | Excellent | Complex cases, detailed reports |

## Troubleshooting

### Ollama Not Starting
```powershell
# Check if running
Get-Process ollama

# Restart service
Restart-Service Ollama
```

### Connection Refused
- Verify Ollama is running: `ollama list`
- Check firewall settings
- Ensure OLLAMA_HOST is set correctly

### Out of Memory
- Use smaller model (llama3.2 instead of llama3.1)
- Close other applications
- Increase system RAM

## Next Steps

After Ollama is installed and running:
1. Install the Node.js Ollama package in your project
2. Configure the AI narrative API endpoint
3. Update your PCR form to use AI-generated narratives

## Resources

- Ollama Documentation: https://ollama.com/docs
- Model Library: https://ollama.com/library
- GitHub: https://github.com/ollama/ollama
