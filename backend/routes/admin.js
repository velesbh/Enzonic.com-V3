import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import privacyRoutes from './privacy.js';
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
  recordActivity,
  getAllUsers,
  getUserStatistics,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  sendUserNotification
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

// User management endpoints
router.get('/users', getAllUsers);
router.get('/users/stats', getUserStatistics);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);
router.post('/users/notify', sendUserNotification);

// Privacy management routes
router.use('/privacy', privacyRoutes);

export default router;