import { env } from './env';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  model?: string;
  thinking?: string; // For AI thinking process
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveChatSessionRequest {
  sessionId?: string;
  sessionName: string;
  messages: ChatMessage[];
  model: string;
}

export interface ChatHistoryItem {
  id: number;
  userMessage: string;
  assistantMessage: string;
  model: string;
  createdAt: string;
}

export interface SaveChatRequest {
  userMessage: string;
  assistantMessage: string;
  model: string;
}

// Save a complete chat session
export async function saveChatSession(session: SaveChatSessionRequest, getToken: () => Promise<string | null>): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, skipping chat session save');
      return false;
    }

    const response = await fetch(`${env.API_URL}/api/chats/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat session save error:', response.status, errorText);
      throw new Error(`Failed to save chat session: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving chat session:', error);
    return false;
  }
}

// Get all chat sessions for the user
export async function getChatSessions(getToken: () => Promise<string | null>): Promise<ChatSession[]> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, returning empty chat sessions');
      return [];
    }

    const response = await fetch(`${env.API_URL}/api/chats/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat sessions fetch error:', response.status, errorText);
      throw new Error(`Failed to fetch chat sessions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

// Delete a chat session
export async function deleteChatSession(sessionId: string, getToken: () => Promise<string | null>): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, skipping chat session delete');
      return false;
    }

    console.log('Deleting session:', sessionId, 'with token present:', !!token);

    const response = await fetch(`${env.API_URL}/api/chats/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Delete response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Chat session delete error:', response.status, errorText);
      throw new Error(`Failed to delete chat session: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
}

// Save individual chat message (legacy function, kept for compatibility)
export async function saveChatMessage(chat: SaveChatRequest, getToken: () => Promise<string | null>): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, skipping chat save');
      return false;
    }

    const response = await fetch(`${env.API_URL}/api/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(chat),
    });

    if (!response.ok) {
      throw new Error(`Failed to save chat: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving chat to history:', error);
    return false;
  }
}

// Get chat history (legacy function)
export async function getChatHistory(getToken: () => Promise<string | null>): Promise<ChatHistoryItem[]> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, returning empty history');
      return [];
    }

    const response = await fetch(`${env.API_URL}/api/chats/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}