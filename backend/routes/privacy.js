import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  getAllPrivacyRequests,
  getUserPersonalData,
  createPrivacyRequest,
  updatePrivacyRequestStatus,
  processErasureRequest,
  generateDataExport,
  downloadExport,
  processRestrictionRequest,
  processConsentWithdrawal,
  getPrivacyAuditLog
} from '../controllers/privacyController.js';

const router = express.Router();

// All privacy routes require admin authentication
router.use(adminAuth);

// Get all privacy requests
router.get('/requests', getAllPrivacyRequests);

// Get user's personal data (for access requests)
router.get('/user-data/:userId', getUserPersonalData);

// Create a new privacy request (admin can create on behalf of users)
router.post('/requests', createPrivacyRequest);

// Update privacy request status
router.put('/requests/:requestId/status', updatePrivacyRequestStatus);

// Process specific types of requests
router.post('/requests/erasure', processErasureRequest);
router.post('/requests/restriction', processRestrictionRequest);
router.post('/requests/consent-withdrawal', processConsentWithdrawal);

// Data export functionality
router.post('/export', generateDataExport);
router.get('/download/:filename', downloadExport);

// Get audit log for a specific request
router.get('/requests/:requestId/audit', getPrivacyAuditLog);

export default router;