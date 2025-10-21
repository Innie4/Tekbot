import { registerAs } from '@nestjs/config';

export const openaiConfig = registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',

  // Model configurations
  models: {
    chat: {
      default: process.env.OPENAI_CHAT_MODEL || 'gpt-4',
      fallback: process.env.OPENAI_CHAT_FALLBACK_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_CHAT_MAX_TOKENS, 10) || 1000,
      temperature: parseFloat(process.env.OPENAI_CHAT_TEMPERATURE) || 0.7,
      topP: parseFloat(process.env.OPENAI_CHAT_TOP_P) || 1,
      frequencyPenalty:
        parseFloat(process.env.OPENAI_CHAT_FREQUENCY_PENALTY) || 0,
      presencePenalty:
        parseFloat(process.env.OPENAI_CHAT_PRESENCE_PENALTY) || 0,
    },
    embedding: {
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      dimensions: parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS, 10) || 1536,
    },
    moderation: {
      model: process.env.OPENAI_MODERATION_MODEL || 'text-moderation-latest',
    },
    whisper: {
      model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    },
    dalle: {
      model: process.env.OPENAI_DALLE_MODEL || 'dall-e-3',
      size: process.env.OPENAI_DALLE_SIZE || '1024x1024',
      quality: process.env.OPENAI_DALLE_QUALITY || 'standard',
      style: process.env.OPENAI_DALLE_STYLE || 'vivid',
    },
  },

  // Request configurations
  timeout: parseInt(process.env.OPENAI_TIMEOUT, 10) || 60000, // 60 seconds
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES, 10) || 3,
  retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY, 10) || 1000,

  // Rate limiting
  rateLimit: {
    requestsPerMinute:
      parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE, 10) || 60,
    tokensPerMinute:
      parseInt(process.env.OPENAI_TOKENS_PER_MINUTE, 10) || 90000,
  },

  // Content filtering
  contentFilter: {
    enabled: process.env.OPENAI_CONTENT_FILTER_ENABLED !== 'false',
    threshold: parseFloat(process.env.OPENAI_CONTENT_FILTER_THRESHOLD) || 0.8,
  },

  // Function calling
  functions: {
    enabled: process.env.OPENAI_FUNCTIONS_ENABLED !== 'false',
    maxFunctions: parseInt(process.env.OPENAI_MAX_FUNCTIONS, 10) || 10,
  },

  // Streaming
  streaming: {
    enabled: process.env.OPENAI_STREAMING_ENABLED !== 'false',
    chunkSize: parseInt(process.env.OPENAI_STREAMING_CHUNK_SIZE, 10) || 1024,
  },

  // Logging
  logging: {
    enabled: process.env.OPENAI_LOGGING_ENABLED === 'true',
    logRequests: process.env.OPENAI_LOG_REQUESTS === 'true',
    logResponses: process.env.OPENAI_LOG_RESPONSES === 'true',
    logErrors: process.env.OPENAI_LOG_ERRORS !== 'false',
  },

  // Prompt templates
  prompts: {
    systemPrompt:
      process.env.OPENAI_SYSTEM_PROMPT ||
      'You are a helpful AI assistant for TekBot Platform.',
    maxPromptLength: parseInt(process.env.OPENAI_MAX_PROMPT_LENGTH, 10) || 4000,
    truncateStrategy: process.env.OPENAI_TRUNCATE_STRATEGY || 'end', // 'start', 'end', 'middle'
  },

  // Cost tracking
  costTracking: {
    enabled: process.env.OPENAI_COST_TRACKING_ENABLED === 'true',
    currency: process.env.OPENAI_COST_CURRENCY || 'USD',
    alertThreshold: parseFloat(process.env.OPENAI_COST_ALERT_THRESHOLD) || 100,
  },
}));
