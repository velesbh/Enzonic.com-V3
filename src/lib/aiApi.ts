import { env } from './env';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  model?: string;
  thinking?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  logo?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Send a chat completion request to the AI API
export async function sendChatCompletion(
  messages: ChatMessage[],
  model: string = 'cubic',
  stream: boolean = false
): Promise<ReadableStream | ChatCompletionResponse> {
  try {
    const requestBody: ChatCompletionRequest = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream,
      temperature: 0.7,
      max_tokens: 2048
    };

    const response = await fetch(env.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    if (stream) {
      return response.body!;
    } else {
      return await response.json() as ChatCompletionResponse;
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

// Parse streaming response
export async function* parseStreamingResponse(stream: ReadableStream): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore invalid JSON chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Model configurations
export const AI_MODELS: Record<string, AIModel> = {
  cubic: {
    id: 'cubic',
    name: 'Cubic',
    description: 'Balanced model for general conversations',
    maxTokens: 4096,
    contextWindow: 16384,
    logo: '/cubic.png'
  },
  nexara: {
    id: 'nexara',
    name: 'Nexara',
    description: 'Advanced reasoning and analysis',
    maxTokens: 4096,
    contextWindow: 32768
  },
  zixen: {
    id: 'zixen',
    name: 'Zixen',
    description: 'Creative and imaginative responses',
    maxTokens: 4096,
    contextWindow: 8192
  },
  'g-coder': {
    id: 'g-coder',
    name: 'G-Coder',
    description: 'Specialized for coding and technical tasks',
    maxTokens: 4096,
    contextWindow: 16384,
    logo: '/g-coder.png'
  }
};