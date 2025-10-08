import pool from '../database/config.js';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';

// Privacy request types
const PRIVACY_REQUEST_TYPES = {
  ACCESS: 'access',
  RECTIFICATION: 'rectification', 
  ERASURE: 'erasure',
  PORTABILITY: 'portability',
  RESTRICTION: 'restriction',
  OBJECTION: 'objection',
  WITHDRAW_CONSENT: 'withdraw_consent',
  CCPA_OPT_OUT: 'ccpa_opt_out'
};

const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

// Get all privacy requests
export async function getAllPrivacyRequests(req, res) {
  try {
    const [requests] = await pool.execute(`
      SELECT 
        pr.*,
        u.email as user_email,
        u.name as user_name
      FROM privacy_requests pr
      LEFT JOIN users u ON pr.user_id = u.clerk_id
      ORDER BY pr.created_at DESC
    `);

    // Get request counts by status
    const [statusCounts] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM privacy_requests
      GROUP BY status
    `);

    const counts = statusCounts.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    res.json({
      success: true,
      requests,
      counts
    });
  } catch (error) {
    console.error('Error fetching privacy requests:', error);
    res.status(500).json({ error: 'Failed to fetch privacy requests' });
  }
}

// Get user's personal data (for access requests)
export async function getUserPersonalData(req, res) {
  try {
    const { userId } = req.params;
    
    // Collect all user data from various tables
    const userData = {
      profile: await getUserProfile(userId),
      chatHistory: await getUserChatHistory(userId),
      translationHistory: await getUserTranslationHistory(userId),
      activityLogs: await getUserActivityLogs(userId),
      apiUsage: await getUserApiUsage(userId),
      preferences: await getUserPreferences(userId)
    };

    // Generate JSON export
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      dataTypes: Object.keys(userData),
      data: userData
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error fetching user personal data:', error);
    res.status(500).json({ error: 'Failed to fetch user personal data' });
  }
}

// Create a new privacy request
export async function createPrivacyRequest(req, res) {
  try {
    const { type, description, userData, requestedBy } = req.body;
    
    if (!Object.values(PRIVACY_REQUEST_TYPES).includes(type)) {
      return res.status(400).json({ error: 'Invalid request type' });
    }

    const requestId = generateRequestId();
    
    await pool.execute(`
      INSERT INTO privacy_requests (
        id, type, description, user_data, status, 
        requested_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      requestId,
      type,
      description,
      JSON.stringify(userData),
      REQUEST_STATUS.PENDING,
      requestedBy
    ]);

    // Log the request creation
    await logPrivacyAction(requestId, 'request_created', `${type} request created`, req.userId);

    res.json({
      success: true,
      requestId,
      message: 'Privacy request created successfully'
    });
  } catch (error) {
    console.error('Error creating privacy request:', error);
    res.status(500).json({ error: 'Failed to create privacy request' });
  }
}

// Update privacy request status
export async function updatePrivacyRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, notes, adminNotes } = req.body;
    
    if (!Object.values(REQUEST_STATUS).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the current request
    const [requests] = await pool.execute(
      'SELECT * FROM privacy_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Privacy request not found' });
    }

    const request = requests[0];

    // Update the request
    await pool.execute(`
      UPDATE privacy_requests 
      SET status = ?, notes = ?, admin_notes = ?, 
          processed_by = ?, processed_at = ?, updated_at = NOW()
      WHERE id = ?
    `, [status, notes, adminNotes, req.userId, new Date(), requestId]);

    // Execute the request if completed
    if (status === REQUEST_STATUS.COMPLETED) {
      await executePrivacyRequest(request);
    }

    // Log the status update
    await logPrivacyAction(requestId, 'status_updated', `Status changed to ${status}`, req.userId);

    res.json({
      success: true,
      message: 'Privacy request status updated successfully'
    });
  } catch (error) {
    console.error('Error updating privacy request status:', error);
    res.status(500).json({ error: 'Failed to update privacy request status' });
  }
}

// Process erasure request (Right to be forgotten)
export async function processErasureRequest(req, res) {
  try {
    const { userId, requestId } = req.body;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete user data from all tables
      await connection.execute('DELETE FROM chat_history WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM translation_history WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM user_activities WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM api_usage_logs WHERE user_id = ?', [userId]);
      await connection.execute('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
      
      // Anonymize remaining references
      await connection.execute(`
        UPDATE privacy_requests 
        SET user_data = JSON_OBJECT('status', 'anonymized', 'date', NOW())
        WHERE requested_by = ? AND id != ?
      `, [userId, requestId]);

      await connection.commit();
      connection.release();

      // Log the erasure
      await logPrivacyAction(requestId, 'data_erased', 'User data permanently deleted', req.userId);

      res.json({
        success: true,
        message: 'User data erased successfully'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error processing erasure request:', error);
    res.status(500).json({ error: 'Failed to process erasure request' });
  }
}

// Generate data export for portability request
export async function generateDataExport(req, res) {
  try {
    const { userId, format: exportFormat = 'json' } = req.body;
    
    const userData = {
      profile: await getUserProfile(userId),
      chatHistory: await getUserChatHistory(userId),
      translationHistory: await getUserTranslationHistory(userId),
      activityLogs: await getUserActivityLogs(userId),
      apiUsage: await getUserApiUsage(userId),
      preferences: await getUserPreferences(userId)
    };

    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      format: exportFormat,
      dataTypes: Object.keys(userData),
      data: userData
    };

    // Create export file
    const filename = `user-data-export-${userId}-${Date.now()}.${exportFormat}`;
    const filepath = path.join(process.cwd(), 'exports', filename);
    
    // Ensure exports directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    if (exportFormat === 'json') {
      await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
    } else if (exportFormat === 'csv') {
      const csv = await convertToCSV(userData);
      await fs.writeFile(filepath, csv);
    }

    res.json({
      success: true,
      filename,
      downloadUrl: `/api/admin/privacy/download/${filename}`,
      message: 'Data export generated successfully'
    });
  } catch (error) {
    console.error('Error generating data export:', error);
    res.status(500).json({ error: 'Failed to generate data export' });
  }
}

// Download exported data
export async function downloadExport(req, res) {
  try {
    const { filename } = req.params;
    const filepath = path.join(process.cwd(), 'exports', filename);
    
    // Security check - ensure filename is safe
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filepath);
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({ error: 'Failed to download export' });
  }
}

// Process data restriction request
export async function processRestrictionRequest(req, res) {
  try {
    const { userId, restrictionType, requestId } = req.body;
    
    // Add restriction flags to user data
    await pool.execute(`
      INSERT INTO user_data_restrictions (user_id, restriction_type, applied_at, applied_by)
      VALUES (?, ?, NOW(), ?)
      ON DUPLICATE KEY UPDATE
      applied_at = NOW(), applied_by = ?
    `, [userId, restrictionType, req.userId, req.userId]);

    // Log the restriction
    await logPrivacyAction(requestId, 'restriction_applied', `Data restriction applied: ${restrictionType}`, req.userId);

    res.json({
      success: true,
      message: 'Data restriction applied successfully'
    });
  } catch (error) {
    console.error('Error processing restriction request:', error);
    res.status(500).json({ error: 'Failed to process restriction request' });
  }
}

// Process consent withdrawal
export async function processConsentWithdrawal(req, res) {
  try {
    const { userId, consentTypes, requestId } = req.body;
    
    // Update consent status
    for (const consentType of consentTypes) {
      await pool.execute(`
        INSERT INTO user_consent (user_id, consent_type, status, updated_at, updated_by)
        VALUES (?, ?, 'withdrawn', NOW(), ?)
        ON DUPLICATE KEY UPDATE
        status = 'withdrawn', updated_at = NOW(), updated_by = ?
      `, [userId, consentType, req.userId, req.userId]);
    }

    // Log the consent withdrawal
    await logPrivacyAction(requestId, 'consent_withdrawn', `Consent withdrawn for: ${consentTypes.join(', ')}`, req.userId);

    res.json({
      success: true,
      message: 'Consent withdrawal processed successfully'
    });
  } catch (error) {
    console.error('Error processing consent withdrawal:', error);
    res.status(500).json({ error: 'Failed to process consent withdrawal' });
  }
}

// Get privacy request audit log
export async function getPrivacyAuditLog(req, res) {
  try {
    const { requestId } = req.params;
    
    const [logs] = await pool.execute(`
      SELECT 
        pal.*,
        u.email as admin_email,
        u.name as admin_name
      FROM privacy_audit_log pal
      LEFT JOIN users u ON pal.admin_id = u.clerk_id
      WHERE pal.request_id = ?
      ORDER BY pal.created_at DESC
    `, [requestId]);

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error fetching privacy audit log:', error);
    res.status(500).json({ error: 'Failed to fetch privacy audit log' });
  }
}

// Helper functions

async function executePrivacyRequest(request) {
  switch (request.type) {
    case PRIVACY_REQUEST_TYPES.ERASURE:
      const userData = JSON.parse(request.user_data);
      await processErasureRequest({ body: { userId: userData.userId, requestId: request.id } });
      break;
    case PRIVACY_REQUEST_TYPES.RESTRICTION:
      // Apply data restrictions
      break;
    case PRIVACY_REQUEST_TYPES.WITHDRAW_CONSENT:
      // Process consent withdrawal
      break;
  }
}

async function getUserProfile(userId) {
  try {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE clerk_id = ?',
      [userId]
    );
    return users[0] || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

async function getUserChatHistory(userId) {
  try {
    const [chats] = await pool.execute(
      'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return chats;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

async function getUserTranslationHistory(userId) {
  try {
    const [translations] = await pool.execute(
      'SELECT * FROM translation_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return translations;
  } catch (error) {
    console.error('Error fetching translation history:', error);
    return [];
  }
}

async function getUserActivityLogs(userId) {
  try {
    const [activities] = await pool.execute(
      'SELECT * FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 1000',
      [userId]
    );
    return activities;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

async function getUserApiUsage(userId) {
  try {
    const [usage] = await pool.execute(
      'SELECT * FROM api_usage_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1000',
      [userId]
    );
    return usage;
  } catch (error) {
    console.error('Error fetching API usage:', error);
    return [];
  }
}

async function getUserPreferences(userId) {
  try {
    const [preferences] = await pool.execute(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    return preferences;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return [];
  }
}

async function logPrivacyAction(requestId, action, description, adminId) {
  try {
    await pool.execute(`
      INSERT INTO privacy_audit_log (request_id, action, description, admin_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [requestId, action, description, adminId]);
  } catch (error) {
    console.error('Error logging privacy action:', error);
  }
}

function generateRequestId() {
  return 'PR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

async function convertToCSV(data) {
  // Simple CSV conversion - could be enhanced with a proper CSV library
  let csv = 'Data Type,Field,Value,Timestamp\n';
  
  for (const [dataType, records] of Object.entries(data)) {
    if (Array.isArray(records)) {
      for (const record of records) {
        for (const [field, value] of Object.entries(record)) {
          csv += `"${dataType}","${field}","${value}","${record.created_at || record.timestamp || ''}"\n`;
        }
      }
    } else if (records && typeof records === 'object') {
      for (const [field, value] of Object.entries(records)) {
        csv += `"${dataType}","${field}","${value}",""\n`;
      }
    }
  }
  
  return csv;
}