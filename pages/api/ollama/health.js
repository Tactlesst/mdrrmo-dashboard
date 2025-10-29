import { checkOllamaHealth, listModels } from '@/lib/ollama';
import logger from '@/lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isHealthy = await checkOllamaHealth();
    
    if (!isHealthy) {
      return res.status(503).json({
        status: 'unavailable',
        message: 'Ollama service is not available',
        host: process.env.OLLAMA_HOST || 'http://localhost:11434'
      });
    }

    const models = await listModels();
    const defaultModel = process.env.OLLAMA_MODEL || 'llama3.2';
    const modelInstalled = models.some(m => m.name.includes(defaultModel));

    return res.status(200).json({
      status: 'healthy',
      host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      defaultModel,
      modelInstalled,
      availableModels: models.map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at
      }))
    });

  } catch (error) {
    logger.error('Ollama health check error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
