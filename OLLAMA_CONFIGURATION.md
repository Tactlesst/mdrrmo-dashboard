# Ollama Configuration Guide

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_FALLBACK=true

# Existing variables
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Configuration Options

### OLLAMA_HOST
- **Default**: `http://localhost:11434`
- **Description**: URL where Ollama service is running
- **Examples**:
  - Local: `http://localhost:11434`
  - Remote server: `http://192.168.1.100:11434`
  - Docker: `http://ollama:11434`

### OLLAMA_MODEL
- **Default**: `llama3.2`
- **Description**: AI model to use for narrative generation
- **Recommended models**:
  - `llama3.2` - Fast, good quality (3B parameters) ✅ Recommended
  - `phi3` - Microsoft's medical-friendly model (3.8B)
  - `mistral` - Higher quality, slower (7B)
  - `llama3.1` - Best quality, slowest (8B)

### OLLAMA_FALLBACK
- **Default**: `true`
- **Description**: Automatically fall back to rule-based generation if AI fails
- **Options**:
  - `true` - Use rule-based method if AI unavailable (recommended)
  - `false` - Return error if AI fails

## Privacy & Security

### ✅ Data Privacy Features
- **All data stays on your infrastructure** - No external API calls
- **No data transmission** - Processing happens locally
- **HIPAA/Medical compliance friendly** - Full control over data
- **Audit trail** - All generations logged

### 🔒 Security Best Practices

1. **Network Isolation**
   ```
   - Run Ollama on internal network only
   - Do NOT expose port 11434 to internet
   - Use firewall rules to restrict access
   ```

2. **Access Control**
   ```
   - Only allow connections from your Next.js server
   - Use VPN for remote administration
   - Monitor Ollama logs for unauthorized access
   ```

3. **Resource Limits**
   ```
   - Set memory limits for Ollama process
   - Monitor CPU/RAM usage
   - Implement rate limiting on API endpoints
   ```

## Testing the Setup

### 1. Check Ollama Health
```bash
# PowerShell
curl http://localhost:11434/api/tags

# Or visit in browser
http://localhost:11434
```

### 2. Test from Your Application
Visit: `http://localhost:3000/api/ollama/health`

Expected response:
```json
{
  "status": "healthy",
  "host": "http://localhost:11434",
  "defaultModel": "llama3.2",
  "modelInstalled": true,
  "availableModels": [...]
}
```

### 3. Generate Test Narrative
Use your PCR form or test with curl:

```bash
curl -X POST http://localhost:3000/api/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "John Doe",
    "age": 45,
    "gender": "Male",
    "chiefComplaints": "Chest pain",
    "bloodPressure": "140/90",
    "useAI": true
  }'
```

## Performance Tuning

### Model Selection by Use Case

| Use Case | Model | Speed | Quality | RAM |
|----------|-------|-------|---------|-----|
| Quick reports | llama3.2 | ⚡⚡⚡ | ⭐⭐⭐ | 4GB |
| Standard reports | phi3 | ⚡⚡ | ⭐⭐⭐⭐ | 6GB |
| Detailed reports | mistral | ⚡ | ⭐⭐⭐⭐⭐ | 8GB |

### Temperature Settings
Located in `lib/ollama.js`:

```javascript
temperature: 0.3  // Lower = more consistent, Higher = more creative
```

- **0.1-0.3**: Consistent, professional medical narratives (recommended)
- **0.4-0.7**: More varied language
- **0.8-1.0**: Creative, but less predictable

## Troubleshooting

### Issue: "Ollama service is not available"
**Solutions**:
1. Check if Ollama is running: `Get-Process ollama`
2. Verify OLLAMA_HOST in `.env.local`
3. Check firewall settings
4. Restart Ollama service

### Issue: "Model not found"
**Solutions**:
1. List installed models: `ollama list`
2. Pull the model: `ollama pull llama3.2`
3. Update OLLAMA_MODEL in `.env.local`

### Issue: Slow generation
**Solutions**:
1. Use smaller model (llama3.2 instead of mistral)
2. Check system resources (RAM, CPU)
3. Close other applications
4. Consider GPU acceleration (if available)

### Issue: Out of memory
**Solutions**:
1. Use smaller model
2. Increase system RAM
3. Close other applications
4. Reduce `num_predict` in `lib/ollama.js`

## Monitoring

### Check Ollama Logs
```powershell
# Windows Event Viewer or Ollama service logs
Get-EventLog -LogName Application -Source Ollama -Newest 50
```

### Monitor Performance
- CPU usage: Task Manager
- RAM usage: Task Manager
- Response times: Check application logs

## Production Deployment

### Checklist
- [ ] Ollama installed on production server
- [ ] Model downloaded and tested
- [ ] Environment variables configured
- [ ] Firewall rules configured
- [ ] Health check endpoint accessible
- [ ] Fallback to rule-based working
- [ ] Monitoring and logging enabled
- [ ] Backup plan if Ollama fails

### Scaling Considerations
- **Single server**: 10-50 concurrent requests
- **Load balancing**: Multiple Ollama instances
- **Caching**: Cache common narratives
- **Queue system**: For high-volume scenarios

## Support

For issues or questions:
1. Check Ollama documentation: https://ollama.com/docs
2. Review application logs
3. Test with health check endpoint
4. Verify model is installed and working
