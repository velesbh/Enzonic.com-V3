import express from 'express';
import { 
  logSearch, 
  getStatistics, 
  getPopularSearches, 
  getRecentSearches,
  getSearchTrends 
} from '../controllers/searchStatsController.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Public endpoint to log searches
router.post('/log', logSearch);

// Admin-only endpoints
router.get('/overview', authenticateAdmin, getStatistics);
router.get('/popular', authenticateAdmin, getPopularSearches);
router.get('/recent', authenticateAdmin, getRecentSearches);
router.get('/trends', authenticateAdmin, getSearchTrends);

export default router;
