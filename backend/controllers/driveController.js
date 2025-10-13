import pool from '../database/config.js';
import {
  generateDocumentId,
  generateFolderId,
  generateEncryptionKey,
  generateShareToken,
  encryptContent,
  decryptContent,
  decryptEncryptionKey,
  deriveUserEncryptionKey,
  encryptMetadata,
  decryptMetadata,
  generateContentChecksum,
  verifyContentIntegrity
} from '../utils/driveEncryption.js';
import { logActivity } from '../middleware/activityTracker.js';

// Document types and file extensions mapping
const FILE_TYPE_MAPPING = {
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.json': 'json',
  '.txt': 'text',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.py': 'python',
  '.python': 'python'
};

// Get file type from extension
function getFileType(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  return FILE_TYPE_MAPPING[ext] || 'other';
}

// Get user's encryption key
async function getUserEncryptionKey(userId, userSecret) {
  try {
    // First, try to get an existing encryption key
    const [keys] = await pool.execute(`
      SELECT * FROM drive_encryption_keys 
      WHERE user_id = ? AND is_active = TRUE 
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    if (keys.length > 0) {
      // Decrypt the existing key
      const keyData = keys[0];
      const encryptionKey = decryptEncryptionKey(keyData.key_encrypted, keyData.key_salt, userSecret);
      return { key: encryptionKey, keyId: keyData.id };
    } else {
      // Generate a new encryption key
      const keyInfo = generateEncryptionKey(userSecret);
      
      // Store the encrypted key in database
      await pool.execute(`
        INSERT INTO drive_encryption_keys (id, user_id, key_encrypted, key_salt, algorithm)
        VALUES (?, ?, ?, ?, ?)
      `, [keyInfo.keyId, userId, keyInfo.encryptedKey, keyInfo.salt, keyInfo.algorithm]);

      // Decrypt and return the key
      const encryptionKey = decryptEncryptionKey(keyInfo.encryptedKey, keyInfo.salt, userSecret);
      return { key: encryptionKey, keyId: keyInfo.keyId };
    }
  } catch (error) {
    throw new Error(`Failed to get user encryption key: ${error.message}`);
  }
}

// Create a new document
export async function createDocument(req, res) {
  try {
    const { name, type, content = '', parentFolderId = null, tags = [], isPublic = false } = req.body;
    const userId = req.userId;
    const userSecret = req.userSecret || userId; // Use user ID as fallback

    if (!name || !type) {
      return res.status(400).json({ error: 'Document name and type are required' });
    }

    // Get or create encryption key
    const { key: encryptionKey, keyId } = await getUserEncryptionKey(userId, userSecret);

    // Encrypt the content
    const { encryptedContent, contentSize } = encryptContent(content, encryptionKey);
    
    // Generate document ID
    const documentId = generateDocumentId();
    
    // Determine file extension
    const fileExtension = name.includes('.') ? name.split('.').pop() : type;
    
    // Encrypt metadata
    const metadata = { tags, checksum: generateContentChecksum(content) };
    const encryptedMetadata = encryptMetadata(metadata, encryptionKey);

    // Insert document into database
    await pool.execute(`
      INSERT INTO drive_documents (
        id, user_id, parent_folder_id, name, type, file_extension,
        content_encrypted, content_size, encryption_key_id, is_public, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      documentId, userId, parentFolderId, name, type, fileExtension,
      encryptedContent, contentSize, keyId, isPublic, encryptedMetadata
    ]);

    // Create initial version
    await pool.execute(`
      INSERT INTO drive_document_versions (
        document_id, version_number, content_encrypted, encryption_key_id,
        change_description, created_by, content_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [documentId, 1, encryptedContent, keyId, 'Initial version', userId, contentSize]);

    // Update storage usage
    await updateStorageUsage(userId);

    // Log activity
    await logDriveActivity(userId, 'create', documentId, null, {
      documentName: name,
      documentType: type
    }, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      document: {
        id: documentId,
        name,
        type,
        fileExtension,
        contentSize,
        isPublic,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      message: 'Document created successfully'
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
}

// Get a document by ID
export async function getDocument(req, res) {
  try {
    const { documentId } = req.params;
    const userId = req.userId;
    const userSecret = req.userSecret || userId;

    // Get document with permission check
    const [documents] = await pool.execute(`
      SELECT d.*, u.name as owner_name, u.email as owner_email
      FROM drive_documents d
      LEFT JOIN users u ON d.user_id = u.clerk_id
      WHERE d.id = ? AND d.is_deleted = FALSE
      AND (d.user_id = ? OR d.is_public = TRUE OR EXISTS (
        SELECT 1 FROM drive_document_shares s
        WHERE s.document_id = d.id 
        AND (s.shared_with = ? OR s.shared_with IS NULL)
        AND s.is_active = TRUE
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
      ))
    `, [documentId, userId, userId]);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const document = documents[0];

    // Get user's encryption key
    const { key: encryptionKey } = await getUserEncryptionKey(document.user_id, userSecret);

    // Decrypt content
    const decryptedContent = decryptContent(document.content_encrypted, encryptionKey);
    
    // Decrypt metadata
    let metadata = {};
    if (document.metadata) {
      try {
        metadata = decryptMetadata(document.metadata, encryptionKey);
      } catch (error) {
        console.warn('Failed to decrypt metadata:', error);
      }
    }

    // Verify content integrity
    const isIntegrityValid = metadata.checksum ? 
      verifyContentIntegrity(decryptedContent, metadata.checksum) : true;

    // Update last accessed time and add to recent documents
    await pool.execute(`
      UPDATE drive_documents SET last_accessed_at = NOW() WHERE id = ?
    `, [documentId]);

    if (document.user_id === userId) {
      await pool.execute(`
        INSERT INTO drive_recent_documents (user_id, document_id, last_accessed_at, access_count)
        VALUES (?, ?, NOW(), 1)
        ON DUPLICATE KEY UPDATE 
        last_accessed_at = NOW(), 
        access_count = access_count + 1
      `, [userId, documentId]);
    }

    // Log activity
    await logDriveActivity(userId, 'read', documentId, null, {
      documentName: document.name
    }, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        fileExtension: document.file_extension,
        content: decryptedContent,
        contentSize: document.content_size,
        version: document.version,
        isPublic: document.is_public,
        parentFolderId: document.parent_folder_id,
        tags: metadata.tags || [],
        isOwner: document.user_id === userId,
        ownerName: document.owner_name,
        ownerEmail: document.owner_email,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
        lastAccessedAt: document.last_accessed_at,
        integrityValid: isIntegrityValid
      }
    });
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
}

// Update a document
export async function updateDocument(req, res) {
  try {
    const { documentId } = req.params;
    const { name, content, tags = [], changeDescription = 'Updated document' } = req.body;
    const userId = req.userId;
    const userSecret = req.userSecret || userId;

    // Check if user owns the document or has write permission
    const [documents] = await pool.execute(`
      SELECT d.*, 
        CASE WHEN d.user_id = ? THEN 'owner'
             WHEN EXISTS (
               SELECT 1 FROM drive_document_shares s
               WHERE s.document_id = d.id AND s.shared_with = ?
               AND s.permission IN ('write', 'admin') AND s.is_active = TRUE
               AND (s.expires_at IS NULL OR s.expires_at > NOW())
             ) THEN 'write'
             ELSE 'none'
        END as user_permission
      FROM drive_documents d
      WHERE d.id = ? AND d.is_deleted = FALSE
    `, [userId, userId, documentId]);

    if (documents.length === 0 || documents[0].user_permission === 'none') {
      return res.status(404).json({ error: 'Document not found or insufficient permissions' });
    }

    const document = documents[0];

    // Get encryption key
    const { key: encryptionKey, keyId } = await getUserEncryptionKey(document.user_id, userSecret);

    // Prepare updated content
    let finalContent = content;
    let finalName = name;
    
    // If only content is being updated, decrypt current content and merge
    if (content !== undefined && name === undefined) {
      finalName = document.name;
    }
    
    if (content === undefined && name !== undefined) {
      finalContent = decryptContent(document.content_encrypted, encryptionKey);
    }

    // Encrypt the new content
    const { encryptedContent, contentSize } = encryptContent(finalContent, encryptionKey);
    
    // Create new metadata with updated checksum
    const metadata = { 
      tags, 
      checksum: generateContentChecksum(finalContent),
      lastModifiedBy: userId
    };
    const encryptedMetadata = encryptMetadata(metadata, encryptionKey);

    // Update document
    await pool.execute(`
      UPDATE drive_documents 
      SET name = ?, content_encrypted = ?, content_size = ?, 
          metadata = ?, version = version + 1, updated_at = NOW()
      WHERE id = ?
    `, [finalName, encryptedContent, contentSize, encryptedMetadata, documentId]);

    // Create new version
    await pool.execute(`
      INSERT INTO drive_document_versions (
        document_id, version_number, content_encrypted, encryption_key_id,
        change_description, created_by, content_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [documentId, document.version + 1, encryptedContent, keyId, changeDescription, userId, contentSize]);

    // Update storage usage
    await updateStorageUsage(document.user_id);

    // Log activity
    await logDriveActivity(userId, 'update', documentId, null, {
      documentName: finalName,
      changeDescription
    }, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      document: {
        id: documentId,
        name: finalName,
        contentSize,
        version: document.version + 1,
        updatedAt: new Date()
      },
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
}

// Delete a document
export async function deleteDocument(req, res) {
  try {
    const { documentId } = req.params;
    const { permanent = false } = req.body;
    const userId = req.userId;

    // Check if user owns the document
    const [documents] = await pool.execute(`
      SELECT * FROM drive_documents 
      WHERE id = ? AND user_id = ? AND is_deleted = FALSE
    `, [documentId, userId]);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const document = documents[0];

    if (permanent) {
      // Permanently delete the document
      await pool.execute('DELETE FROM drive_documents WHERE id = ?', [documentId]);
    } else {
      // Soft delete
      await pool.execute(`
        UPDATE drive_documents SET is_deleted = TRUE, updated_at = NOW() 
        WHERE id = ?
      `, [documentId]);
    }

    // Update storage usage
    await updateStorageUsage(userId);

    // Log activity
    await logDriveActivity(userId, 'delete', documentId, null, {
      documentName: document.name,
      permanent
    }, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: permanent ? 'Document permanently deleted' : 'Document moved to trash'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

// Get user's documents with folder structure
export async function getUserDocuments(req, res) {
  try {
    const userId = req.userId;
    const { folderId = null, includeDeleted = false, search = '', type = '', limit = 50, offset = 0 } = req.query;

    let whereConditions = ['d.user_id = ?'];
    let queryParams = [userId];

    // Folder filter
    if (folderId === 'null' || folderId === null) {
      whereConditions.push('d.parent_folder_id IS NULL');
    } else if (folderId) {
      whereConditions.push('d.parent_folder_id = ?');
      queryParams.push(folderId);
    }

    // Deleted filter
    if (!includeDeleted) {
      whereConditions.push('d.is_deleted = FALSE');
    }

    // Type filter
    if (type) {
      whereConditions.push('d.type = ?');
      queryParams.push(type);
    }

    // Search filter
    if (search) {
      whereConditions.push('d.name LIKE ?');
      queryParams.push(`%${search}%`);
    }

    // Add limit and offset
    queryParams.push(parseInt(limit), parseInt(offset));

    const [documents] = await pool.execute(`
      SELECT 
        d.id, d.name, d.type, d.file_extension, d.content_size, d.version,
        d.is_public, d.is_deleted, d.created_at, d.updated_at, d.last_accessed_at,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM drive_documents d
      LEFT JOIN drive_document_favorites f ON d.id = f.document_id AND f.user_id = ?
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY d.updated_at DESC
      LIMIT ? OFFSET ?
    `, [userId, ...queryParams]);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM drive_documents d
      WHERE ${whereConditions.slice(0, -2).join(' AND ')}
    `, queryParams.slice(0, -2));

    res.json({
      success: true,
      documents,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult[0].total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting user documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
}

// Create a new folder
export async function createFolder(req, res) {
  try {
    const { name, parentFolderId = null, description = '', color = '#3B82F6' } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Check if folder name already exists in the same parent
    const [existing] = await pool.execute(`
      SELECT id FROM drive_folders 
      WHERE user_id = ? AND parent_folder_id = ? AND name = ? AND is_deleted = FALSE
    `, [userId, parentFolderId, name]);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Folder with this name already exists' });
    }

    // Generate folder ID
    const folderId = generateFolderId();

    // Insert folder
    await pool.execute(`
      INSERT INTO drive_folders (
        id, user_id, parent_folder_id, name, description, color
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [folderId, userId, parentFolderId, name, description, color]);

    // Update storage usage
    await updateStorageUsage(userId);

    // Log activity
    await logDriveActivity(userId, 'create', null, folderId, {
      folderName: name
    }, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      folder: {
        id: folderId,
        name,
        description,
        color,
        parentFolderId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

// Get user's folders
export async function getUserFolders(req, res) {
  try {
    const userId = req.userId;
    const { parentFolderId = null, includeDeleted = false } = req.query;

    let whereConditions = ['user_id = ?'];
    let queryParams = [userId];

    // Parent folder filter
    if (parentFolderId === 'null' || parentFolderId === null) {
      whereConditions.push('parent_folder_id IS NULL');
    } else if (parentFolderId) {
      whereConditions.push('parent_folder_id = ?');
      queryParams.push(parentFolderId);
    }

    // Deleted filter
    if (!includeDeleted) {
      whereConditions.push('is_deleted = FALSE');
    }

    const [folders] = await pool.execute(`
      SELECT 
        id, name, description, color, parent_folder_id, is_public, is_deleted,
        created_at, updated_at,
        (SELECT COUNT(*) FROM drive_documents WHERE parent_folder_id = f.id AND is_deleted = FALSE) as document_count,
        (SELECT COUNT(*) FROM drive_folders sub WHERE sub.parent_folder_id = f.id AND sub.is_deleted = FALSE) as subfolder_count
      FROM drive_folders f
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY name ASC
    `, queryParams);

    res.json({
      success: true,
      folders
    });
  } catch (error) {
    console.error('Error getting user folders:', error);
    res.status(500).json({ error: 'Failed to get folders' });
  }
}

// Share a document
export async function shareDocument(req, res) {
  try {
    const { documentId } = req.params;
    const { sharedWith = null, permission = 'read', expiresAt = null } = req.body;
    const userId = req.userId;

    // Check if user owns the document
    const [documents] = await pool.execute(`
      SELECT * FROM drive_documents 
      WHERE id = ? AND user_id = ? AND is_deleted = FALSE
    `, [documentId, userId]);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Generate share token
    const shareToken = generateShareToken();

    // Create share record
    await pool.execute(`
      INSERT INTO drive_document_shares (
        document_id, shared_by, shared_with, permission, share_token, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [documentId, userId, sharedWith, permission, shareToken, expiresAt]);

    // Log activity
    await logDriveActivity(userId, 'share', documentId, null, {
      documentName: documents[0].name,
      sharedWith,
      permission
    }, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      shareToken,
      shareUrl: `${req.protocol}://${req.get('host')}/drive/shared/${shareToken}`,
      message: 'Document shared successfully'
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
}

// Get document by share token
export async function getSharedDocument(req, res) {
  try {
    const { shareToken } = req.params;

    // Get document through share token
    const [shares] = await pool.execute(`
      SELECT d.*, s.permission, s.expires_at, s.shared_by,
        u.name as owner_name, u.email as owner_email
      FROM drive_document_shares s
      JOIN drive_documents d ON s.document_id = d.id
      LEFT JOIN users u ON d.user_id = u.clerk_id
      WHERE s.share_token = ? AND s.is_active = TRUE
      AND (s.expires_at IS NULL OR s.expires_at > NOW())
      AND d.is_deleted = FALSE
    `, [shareToken]);

    if (shares.length === 0) {
      return res.status(404).json({ error: 'Shared document not found or expired' });
    }

    const share = shares[0];

    // For now, return limited info for shared documents
    // In a full implementation, you'd decrypt content if user has permission
    res.json({
      success: true,
      document: {
        id: share.id,
        name: share.name,
        type: share.type,
        fileExtension: share.file_extension,
        contentSize: share.content_size,
        isPublic: share.is_public,
        permission: share.permission,
        ownerName: share.owner_name,
        createdAt: share.created_at,
        updatedAt: share.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting shared document:', error);
    res.status(500).json({ error: 'Failed to get shared document' });
  }
}

// Get document versions
export async function getDocumentVersions(req, res) {
  try {
    const { documentId } = req.params;
    const userId = req.userId;

    // Check if user has access to the document
    const [documents] = await pool.execute(`
      SELECT * FROM drive_documents 
      WHERE id = ? AND (user_id = ? OR is_public = TRUE) AND is_deleted = FALSE
    `, [documentId, userId]);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Get versions
    const [versions] = await pool.execute(`
      SELECT 
        v.id, v.version_number, v.change_description, v.content_size,
        v.created_at, u.name as created_by_name, u.email as created_by_email
      FROM drive_document_versions v
      LEFT JOIN users u ON v.created_by = u.clerk_id
      WHERE v.document_id = ?
      ORDER BY v.version_number DESC
    `, [documentId]);

    res.json({
      success: true,
      versions
    });
  } catch (error) {
    console.error('Error getting document versions:', error);
    res.status(500).json({ error: 'Failed to get document versions' });
  }
}

// Get recent documents
export async function getRecentDocuments(req, res) {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;

    const [documents] = await pool.execute(`
      SELECT 
        d.id, d.name, d.type, d.file_extension, d.content_size,
        d.updated_at, r.last_accessed_at, r.access_count
      FROM drive_recent_documents r
      JOIN drive_documents d ON r.document_id = d.id
      WHERE r.user_id = ? AND d.is_deleted = FALSE
      ORDER BY r.last_accessed_at DESC
      LIMIT ?
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error getting recent documents:', error);
    res.status(500).json({ error: 'Failed to get recent documents' });
  }
}

// Toggle document favorite
export async function toggleDocumentFavorite(req, res) {
  try {
    const { documentId } = req.params;
    const userId = req.userId;

    // Check if document exists and user has access
    const [documents] = await pool.execute(`
      SELECT * FROM drive_documents 
      WHERE id = ? AND (user_id = ? OR is_public = TRUE) AND is_deleted = FALSE
    `, [documentId, userId]);

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Check if already favorited
    const [favorites] = await pool.execute(`
      SELECT * FROM drive_document_favorites 
      WHERE user_id = ? AND document_id = ?
    `, [userId, documentId]);

    let isFavorite = false;

    if (favorites.length > 0) {
      // Remove from favorites
      await pool.execute(`
        DELETE FROM drive_document_favorites 
        WHERE user_id = ? AND document_id = ?
      `, [userId, documentId]);
    } else {
      // Add to favorites
      await pool.execute(`
        INSERT INTO drive_document_favorites (user_id, document_id)
        VALUES (?, ?)
      `, [userId, documentId]);
      isFavorite = true;
    }

    res.json({
      success: true,
      isFavorite,
      message: isFavorite ? 'Document added to favorites' : 'Document removed from favorites'
    });
  } catch (error) {
    console.error('Error toggling document favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}

// Get user's storage usage
export async function getStorageUsage(req, res) {
  try {
    const userId = req.userId;

    const [usage] = await pool.execute(`
      SELECT * FROM drive_storage_quota WHERE user_id = ?
    `, [userId]);

    if (usage.length === 0) {
      // Initialize storage usage
      await pool.execute(`
        INSERT INTO drive_storage_quota (user_id) VALUES (?)
      `, [userId]);
      
      // Calculate initial usage
      await updateStorageUsage(userId);
      
      // Get updated usage
      const [newUsage] = await pool.execute(`
        SELECT * FROM drive_storage_quota WHERE user_id = ?
      `, [userId]);
      
      return res.json({
        success: true,
        usage: newUsage[0]
      });
    }

    res.json({
      success: true,
      usage: usage[0]
    });
  } catch (error) {
    console.error('Error getting storage usage:', error);
    res.status(500).json({ error: 'Failed to get storage usage' });
  }
}

// Helper function to update storage usage
async function updateStorageUsage(userId) {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN is_deleted = FALSE THEN 1 END) as document_count,
        COALESCE(SUM(CASE WHEN is_deleted = FALSE THEN content_size ELSE 0 END), 0) as total_size
      FROM drive_documents 
      WHERE user_id = ?
    `, [userId]);

    const [folderStats] = await pool.execute(`
      SELECT COUNT(*) as folder_count
      FROM drive_folders 
      WHERE user_id = ? AND is_deleted = FALSE
    `, [userId]);

    await pool.execute(`
      UPDATE drive_storage_quota 
      SET document_count = ?, folder_count = ?, used_space = ?, last_calculated = NOW()
      WHERE user_id = ?
    `, [stats[0].document_count, folderStats[0].folder_count, stats[0].total_size, userId]);
  } catch (error) {
    console.error('Error updating storage usage:', error);
  }
}

// Helper function to log drive activities
export async function logDriveActivity(userId, action, documentId = null, folderId = null, details = {}, ipAddress = null, userAgent = null) {
  try {
    await pool.execute(`
      INSERT INTO drive_activity (
        user_id, document_id, folder_id, action, details, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, documentId, folderId, action, JSON.stringify(details), ipAddress, userAgent]);
  } catch (error) {
    console.error('Error logging drive activity:', error);
  }
}

// Get drive activity log
export async function getDriveActivity(req, res) {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const [activities] = await pool.execute(`
      SELECT 
        a.*, d.title as document_name, f.name as folder_name
      FROM drive_activity a
      LEFT JOIN drive_documents d ON a.document_id = d.id
      LEFT JOIN drive_folders f ON a.folder_id = f.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error getting drive activity:', error);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
}