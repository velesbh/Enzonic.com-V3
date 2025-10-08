import { saveChat, getChatHistory, saveChatSession, getChatSessions, deleteChatSession, recordStatistic } from '../database/config.js';

// Save a new chat exchange
export async function saveChatController(req, res) {
  try {
    const { userMessage, assistantMessage, model } = req.body;
    const userId = req.userId;
    
    if (!userMessage || !assistantMessage || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: userMessage, assistantMessage, model' 
      });
    }
    
    const chatId = await saveChat(
      userId, 
      userMessage, 
      assistantMessage, 
      model
    );
    
    // Record chat statistic
    await recordStatistic('chat_request', {
      userId,
      model,
      userMessageLength: userMessage.length,
      assistantMessageLength: assistantMessage.length,
      timestamp: new Date().toISOString()
    }, 'chatbot');
    
    res.json({ 
      success: true, 
      chatId,
      message: 'Chat saved successfully' 
    });
  } catch (error) {
    console.error('Error saving chat:', error);
    
    // Record error statistic
    await recordStatistic('error_occurred', {
      error: error.message,
      endpoint: '/api/chats',
      userId: req.userId
    });
    
    res.status(500).json({ error: 'Failed to save chat' });
  }
}

// Get chat history for the authenticated user
export async function getChatHistoryController(req, res) {
  try {
    const userId = req.userId;
    const history = await getChatHistory(userId);
    
    // Format the response
    const formattedHistory = history.map(item => ({
      id: item.id,
      userMessage: item.user_message,
      assistantMessage: item.assistant_message,
      model: item.model,
      createdAt: item.created_at
    }));
    
    res.json({ 
      success: true, 
      history: formattedHistory 
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
}

// Save a complete chat session
export async function saveChatSessionController(req, res) {
  try {
    const { sessionId, sessionName, messages, model } = req.body;
    const userId = req.userId;
    
    if (!sessionId || !sessionName || !messages || !Array.isArray(messages) || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, sessionName, messages (array), model' 
      });
    }
    
    const savedSessionId = await saveChatSession(
      userId, 
      sessionId,
      sessionName,
      JSON.stringify(messages),
      model
    );
    
    // Record chat session statistic
    await recordStatistic('chat_session_save', {
      userId,
      model,
      sessionId,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    }, 'chatbot');
    
    res.json({ 
      success: true, 
      sessionId: savedSessionId,
      message: 'Chat session saved successfully' 
    });
  } catch (error) {
    console.error('Error saving chat session:', error);
    
    // Record error statistic
    await recordStatistic('error_occurred', {
      error: error.message,
      endpoint: '/api/chats/session',
      userId: req.userId
    });
    
    res.status(500).json({ error: 'Failed to save chat session' });
  }
}

// Get all chat sessions for the authenticated user
export async function getChatSessionsController(req, res) {
  try {
    const userId = req.userId;
    const sessions = await getChatSessions(userId);
    
    // Format the response
    const formattedSessions = sessions.map(item => ({
      id: item.session_id,
      name: item.session_name,
      messages: JSON.parse(item.messages || '[]'),
      createdAt: item.created_at,
      updatedAt: item.updated_at || item.created_at
    }));
    
    res.json({ 
      success: true, 
      sessions: formattedSessions 
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
}

// Delete a chat session
export async function deleteChatSessionController(req, res) {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: sessionId' 
      });
    }
    
    const success = await deleteChatSession(userId, sessionId);
    
    if (success) {
      // Record delete statistic
      await recordStatistic('chat_session_delete', {
        userId,
        sessionId,
        timestamp: new Date().toISOString()
      }, 'chatbot');
      
      res.json({ 
        success: true, 
        message: 'Chat session deleted successfully' 
      });
    } else {
      res.status(404).json({ error: 'Chat session not found' });
    }
  } catch (error) {
    console.error('Error deleting chat session:', error);
    
    // Record error statistic
    await recordStatistic('error_occurred', {
      error: error.message,
      endpoint: '/api/chats/session/:sessionId',
      userId: req.userId
    });
    
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
}