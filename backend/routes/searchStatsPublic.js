import express from 'express';
import * as searchStatsController from '../controllers/searchStatsControllerMySQL.js';

const router = express.Router();

// Public endpoint - log search queries (no authentication required)
router.post('/log', searchStatsController.logSearch);

export default router;
