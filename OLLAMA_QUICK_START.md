# Ollama Quick Start Guide

## 🚀 Get AI Narrative Generation Running in 5 Minutes

### Step 1: Install Ollama (2 minutes)

1. **Download Ollama for Windows**
   - Visit: https://ollama.com/download/windows
   - Download and run `OllamaSetup.exe`
   - Installation is automatic

2. **Verify Installation**
   ```powershell
   ollama --version
   ```
   You should see: `ollama version is X.X.X`

### Step 2: Download AI Model (2 minutes)

```powershell
# Download Llama 3.2 (recommended - fast and accurate)
ollama pull llama3.2
```

Wait for download to complete (~2GB).

### Step 3: Configure Your App (1 minute)

Add to your `.env.local` file:

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_FALLBACK=true
```

### Step 4: Restart Your App

```powershell
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Test It! ✅

1. **Check Health Status**
   - Visit: http://localhost:3000/api/ollama/health
   - Should show: `"status": "healthy"`

2. **Generate a Narrative**
   - Open your PCR form
   - Fill in patient data
   - Click "Generate Narrative"
   - You should see AI-generated text!

## 🎉 You're Done!

Your system now uses **private, self-hosted AI** for narrative generation.

## What Happens Now?

- ✅ **AI generates narratives** from your PCR form data
- ✅ **All data stays private** on your server
- ✅ **Automatic fallback** if AI is unavailable
- ✅ **No external API calls** - complete privacy

## Next Steps

### Optional: Try Different Models

```powershell
# More detailed narratives (slower)
ollama pull mistral

# Medical-focused model
ollama pull phi3
```

Then update `.env.local`:
```env
OLLAMA_MODEL=mistral
```

### Optional: Customize AI Behavior

Edit `lib/ollama.js` to adjust:
- Temperature (creativity level)
- Max length
- Prompt format

## Troubleshooting

### "Service unavailable" error?
```powershell
# Check if Ollama is running
Get-Process ollama

# If not running, start it
ollama serve
```

### Model not found?
```powershell
# List installed models
ollama list

# Pull the model again
ollama pull llama3.2
```

### Slow generation?
- Use `llama3.2` (fastest)
- Close other applications
- Check RAM usage

## Privacy Guarantee

✅ **Your medical data NEVER leaves your server**
- No OpenAI
- No Google
- No external APIs
- 100% self-hosted

Perfect for HIPAA compliance and medical data privacy!

## Need Help?

See detailed guides:
- `OLLAMA_SETUP_GUIDE.md` - Complete installation guide
- `OLLAMA_CONFIGURATION.md` - Advanced configuration
