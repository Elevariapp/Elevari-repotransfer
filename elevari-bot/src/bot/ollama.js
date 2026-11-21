import axios from 'axios';
import { config } from '../config/index.js';

const ollamaClient = axios.create({
  baseURL: config.ollama.host,
  timeout: 60000,
});

export async function generateCompletion(messages, options = {}) {
  const response = await ollamaClient.post('/api/chat', {
    model: config.ollama.model,
    messages,
    stream: false,
    temperature: options.temperature ?? 0.3,
    top_p: options.top_p ?? 0.9,
  });

  return response.data.message?.content || '';
}

export async function generateEmbedding(text) {
  const response = await ollamaClient.post('/api/embeddings', {
    model: config.ollama.embedModel,
    prompt: text,
  });

  return response.data.embedding || [];
}

export async function checkOllamaHealth() {
  try {
    await ollamaClient.get('/api/tags');
    return true;
  } catch (err) {
    return false;
  }
}