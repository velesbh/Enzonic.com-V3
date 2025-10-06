import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { logApiUsageMiddleware } from '../controllers/adminController.js';
import { trackActivity } from '../middleware/activityTracker.js';
import { 
  saveTranslationController, 
  getTranslationHistoryController 
} from '../controllers/translationController.js';

const router = express.Router();

// Apply API usage logging for all translation routes
router.use(logApiUsageMiddleware('translate'));

// All routes require authentication
router.use(authenticateUser);

// POST /api/translations - Save a new translation
router.post('/', trackActivity('translation_request', 'translate'), saveTranslationController);

// GET /api/translations/history - Get translation history
router.get('/history', trackActivity('translation_history_request', 'translate'), getTranslationHistoryController);

export default router;