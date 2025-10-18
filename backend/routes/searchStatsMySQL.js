import express from 'express';
import * as searchStatsController from '../controllers/searchStatsControllerMySQL.js';

const router = express.Router();

// Note: Authentication is handled by parent admin router

// Admin-only endpoints (authenticated by parent)
router.get('/overview', searchStatsController.getStatistics);
router.get('/popular', searchStatsController.getPopularSearches);
router.get('/recent', searchStatsController.getRecentSearches);
router.get('/trends', searchStatsController.getSearchTrends);

export default router;
