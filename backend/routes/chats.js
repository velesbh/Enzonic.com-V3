import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { logApiUsageMiddleware } from '../controllers/adminController.js';
import { trackActivity } from '../middleware/activityTracker.js';
import { 
  saveChatController, 
  getChatHistoryController,
  saveChatSessionController,
  getChatSessionsController,
  deleteChatSessionController
} from '../controllers/chatController.js';

const router = express.Router();

// Apply API usage logging for all chat routes
router.use(logApiUsageMiddleware('chatbot'));

// All routes require authentication
router.use(authenticateUser);

// POST /api/chats - Save a new chat exchange
router.post('/', trackActivity('chat_request', 'chatbot'), saveChatController);

// GET /api/chats/history - Get chat history
router.get('/history', trackActivity('chat_history_request', 'chatbot'), getChatHistoryController);

// POST /api/chats/session - Save a complete chat session
router.post('/session', trackActivity('chat_session_save', 'chatbot'), saveChatSessionController);

// GET /api/chats/sessions - Get all chat sessions
router.get('/sessions', trackActivity('chat_sessions_request', 'chatbot'), getChatSessionsController);

// DELETE /api/chats/session/:sessionId - Delete a chat session
router.delete('/session/:sessionId', trackActivity('chat_session_delete', 'chatbot'), deleteChatSessionController);

export default router;