import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

// Configure S3/MinIO client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET || 'enzonic-storage';

/**
 * Upload a file to S3/MinIO
 * @param {string} key - The file key/path in the bucket
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} contentType - The MIME type of the file
 * @param {object} options - Additional options (cacheControl, etc.)
 * @returns {Promise<string>} The file URL
 */
export async function uploadFile(key, fileBuffer, contentType, options = {}) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: options.cacheControl || (contentType.startsWith('audio/') ? 'max-age=31536000' : 'max-age=3600'),
      // Remove ACL - MinIO bucket must have public policy configured instead
    });

    await s3Client.send(command);

    // Return the public URL
    const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
    return `${endpoint}/${BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Get a signed URL for private file access
 * @param {string} key - The file key/path in the bucket
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} The signed URL
 */
export async function getSignedFileUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Delete a file from S3/MinIO
 * @param {string} key - The file key/path in the bucket
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFile(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
}

/**
 * Check if a file exists in S3/MinIO
 * @param {string} key - The file key/path in the bucket
 * @returns {Promise<boolean>} Whether the file exists
 */
export async function fileExists(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    console.error('Error checking file existence:', error);
    throw error;
  }
}

/**
 * Generate a unique file key for uploads
 * @param {string} userId - The user ID
 * @param {string} filename - Original filename
 * @param {string} folder - Folder name (e.g., 'songs', 'covers', 'profiles')
 * @returns {string} Unique file key
 */
export function generateFileKey(userId, filename, folder = 'uploads') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop();
  return `${folder}/${userId}/${timestamp}-${random}.${extension}`;
}

/**
 * Add signed URLs to an array of songs
 * @param {Array} songs - Array of song objects with file_url property
 * @returns {Promise<void>}
 */
export async function addSignedUrls(songs) {
  for (const song of songs) {
    if (song.file_url) {
      try {
        const url = new URL(song.file_url);
        const key = url.pathname.split('/').slice(2).join('/');
        song.file_url = await getSignedFileUrl(key, 3600);
      } catch (error) {
        console.error('Error generating signed URL for song:', error);
      }
    }
  }
}

export default s3Client;
