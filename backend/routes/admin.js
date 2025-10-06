import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import {
  getAdminStatus,
  getEnvironmentVariables,
  updateEnvironmentVariables,
  getServiceConfigurations_API,
  updateServiceConfiguration_API,
  getLiveStatistics,
  getSystemHealth,
  trackPageView,
  trackInteraction,
  checkServiceStatus,
  getAllServicesStatus,
  getRealtimeData,
  recordActivity
} from '../controllers/adminController.js';

const router = express.Router();

// Check admin status (requires basic auth)
router.get('/status', authenticateUser, getAdminStatus);

// Public service status endpoints (no auth required for service availability checks)
router.get('/services/:serviceId/status', checkServiceStatus);
router.get('/services/status', getAllServicesStatus);

// Real-time data endpoint (requires basic auth)
router.get('/realtime', authenticateUser, getRealtimeData);

// Activity recording (requires basic auth)
router.post('/activity', authenticateUser, recordActivity);

// All other routes require admin authentication
router.use(authenticateAdmin);

// Environment variables management
router.get('/env', getEnvironmentVariables);
router.put('/env', updateEnvironmentVariables);

// Service configurations
router.get('/services', getServiceConfigurations_API);
router.put('/services/:serviceId', updateServiceConfiguration_API);

// Statistics and monitoring
router.get('/stats', getLiveStatistics);
router.get('/health', getSystemHealth);

// Activity tracking endpoints (for frontend)
router.post('/track/page-view', trackPageView);
router.post('/track/interaction', trackInteraction);

export default router;