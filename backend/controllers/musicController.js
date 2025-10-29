import pool from '../database/config.js';
import { uploadFile, deleteFile, generateFileKey, getSignedFileUrl, addSignedUrls } from '../utils/s3Client.js';
import { sendSongApprovedEmail, sendSongRejectedEmail, sendSongPendingEmail } from '../utils/emailService.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Helper function to execute queries
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// Helper function to compress audio file
const compressAudio = (inputBuffer, inputFormat) => {
  return new Promise((resolve, reject) => {
    const tempInput = path.join(os.tmpdir(), `input_${Date.now()}.${inputFormat}`);
    const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}.mp3`);

    // Write input buffer to temp file
    fs.writeFile(tempInput, inputBuffer)
      .then(() => {
        ffmpeg(tempInput)
          .audioCodec('libmp3lame')
          .audioBitrate(128) // 128kbps for good quality and smaller size
          .audioFrequency(44100)
          .audioChannels(2)
          .format('mp3')
          .on('end', async () => {
            try {
              const compressedBuffer = await fs.readFile(tempOutput);
              // Cleanup temp files
              await fs.unlink(tempInput);
              await fs.unlink(tempOutput);
              resolve(compressedBuffer);
            } catch (error) {
              reject(error);
            }
          })
          .on('error', (err) => {
            // Cleanup on error
            fs.unlink(tempInput).catch(() => {});
            fs.unlink(tempOutput).catch(() => {});
            reject(err);
          })
          .save(tempOutput);
      })
      .catch(reject);
  });
};

/**
 * Create a new artist profile
 */
export async function createArtist(req, res) {
  try {
    const { name, bio } = req.body;
    const userId = req.userId;

    // Check if user already has an artist profile
    const existing = await query(
      'SELECT * FROM artists WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have an artist profile' });
    }

    const artistId = `artist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle profile and cover image uploads if provided
    let profileImageUrl = null;
    let coverImageUrl = null;

    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        const profileKey = generateFileKey(userId, req.files.profileImage[0].originalname, 'profiles');
        profileImageUrl = await uploadFile(profileKey, req.files.profileImage[0].buffer, req.files.profileImage[0].mimetype);
      }
      if (req.files.coverImage && req.files.coverImage[0]) {
        const coverKey = generateFileKey(userId, req.files.coverImage[0].originalname, 'covers');
        coverImageUrl = await uploadFile(coverKey, req.files.coverImage[0].buffer, req.files.coverImage[0].mimetype);
      }
    }

    await query(
      'INSERT INTO artists (id, user_id, name, bio, profile_image_url, cover_image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [artistId, userId, name, bio, profileImageUrl, coverImageUrl]
    );

    res.json({ 
      success: true, 
      artistId,
      message: 'Artist profile created successfully' 
    });
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ error: 'Failed to create artist profile' });
  }
}

/**
 * Get artist profile by user ID
 */
export async function getArtistByUserId(req, res) {
  try {
    const userId = req.userId;

    const artists = await query(
      'SELECT * FROM artists WHERE user_id = ?',
      [userId]
    );

    if (artists.length === 0) {
      return res.json({ artist: null });
    }

    // Generate signed URLs for images
    const artist = artists[0];
    if (artist.profile_image_url) {
      try {
        const url = new URL(artist.profile_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        artist.profile_image_url = await getSignedFileUrl(key, 3600);
      } catch (error) {
        console.error('Error generating signed URL for artist profile image:', error);
      }
    }
    if (artist.cover_image_url) {
      try {
        const url = new URL(artist.cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        artist.cover_image_url = await getSignedFileUrl(key, 3600);
      } catch (error) {
        console.error('Error generating signed URL for artist cover image:', error);
      }
    }
    if (artist.background_image_url) {
      try {
        const url = new URL(artist.background_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        artist.background_image_url = await getSignedFileUrl(key, 3600);
      } catch (error) {
        console.error('Error generating signed URL for artist background image:', error);
      }
    }
    res.json({ artist });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Failed to fetch artist profile' });
  }
}

/**
 * Get all artists
 */
export async function getAllArtists(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const artists = await query(
      'SELECT * FROM artists ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );

    // Generate signed URLs for images for all artists
    for (const artist of artists) {
      if (artist.profile_image_url) {
        try {
          const url = new URL(artist.profile_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          artist.profile_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for artist profile image:', error);
        }
      }
      if (artist.cover_image_url) {
        try {
          const url = new URL(artist.cover_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          artist.cover_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for artist cover image:', error);
        }
      }
      if (artist.background_image_url) {
        try {
          const url = new URL(artist.background_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          artist.background_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for artist background image:', error);
        }
      }
    }
    res.json({ artists });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
}

/**
 * Update artist profile
 */
export async function updateArtist(req, res) {
  try {
    const userId = req.userId;
    const { name, bio } = req.body;

    // Get current artist
    const artists = await query(
      'SELECT * FROM artists WHERE user_id = ?',
      [userId]
    );

    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    const artistId = artists[0].id;
    let profileImageUrl = artists[0].profile_image_url;
    let coverImageUrl = artists[0].cover_image_url;

    // Handle profile image upload if provided
    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        // Delete old profile image if exists
        if (profileImageUrl) {
          try {
            const url = new URL(profileImageUrl);
            const key = url.pathname.split('/').slice(2).join('/');
            await deleteFile(key);
          } catch (error) {
            console.error('Error deleting old profile image:', error);
          }
        }

        const profileKey = generateFileKey(userId, req.files.profileImage[0].originalname, 'profiles');
        profileImageUrl = await uploadFile(profileKey, req.files.profileImage[0].buffer, req.files.profileImage[0].mimetype);
      }

      if (req.files.coverImage && req.files.coverImage[0]) {
        // Delete old cover image if exists
        if (coverImageUrl) {
          try {
            const url = new URL(coverImageUrl);
            const key = url.pathname.split('/').slice(2).join('/');
            await deleteFile(key);
          } catch (error) {
            console.error('Error deleting old cover image:', error);
          }
        }

        const coverKey = generateFileKey(userId, req.files.coverImage[0].originalname, 'covers');
        coverImageUrl = await uploadFile(coverKey, req.files.coverImage[0].buffer, req.files.coverImage[0].mimetype);
      }
    }

    // Update artist in database
    await query(
      `UPDATE artists SET name = ?, bio = ?, profile_image_url = ?, cover_image_url = ? WHERE id = ?`,
      [name || artists[0].name, bio || artists[0].bio, profileImageUrl, coverImageUrl, artistId]
    );

    const updated = await query('SELECT * FROM artists WHERE id = ?', [artistId]);

    res.json({ 
      success: true, 
      message: 'Artist profile updated',
      artist: updated[0]
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ error: 'Failed to update artist profile' });
  }
}

/**
 * Upload a song
 */
export async function uploadSong(req, res) {
  try {
    const { artistId, title, albumId, duration, hasLyrics, lyricsData, tagIds } = req.body;
    const userId = req.userId;
    const userEmail = req.userEmail || 'noemail@example.com';

    // Verify artist belongs to user
    const artists = await query(
      'SELECT * FROM artists WHERE id = ? AND user_id = ?',
      [artistId, userId]
    );

    if (artists.length === 0) {
      return res.status(403).json({ error: 'Artist not found or unauthorized' });
    }

    // File should be in req.files.audioFile (using multer middleware with fields)
    if (!req.files || !req.files.audioFile || !req.files.audioFile[0]) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.files.audioFile[0];

    // Compress audio file
    let compressedBuffer;
    let finalFormat = 'mp3';
    try {
      console.log('Compressing audio file...');
      compressedBuffer = await compressAudio(audioFile.buffer, audioFile.mimetype.split('/')[1]);
      console.log('Audio compression completed');
    } catch (compressionError) {
      console.error('Audio compression failed:', compressionError);
      // Fallback to original file if compression fails
      compressedBuffer = audioFile.buffer;
      finalFormat = audioFile.mimetype.split('/')[1];
    }

    // Upload compressed file to S3/MinIO
    const fileKey = generateFileKey(userId, audioFile.originalname.replace(/\.[^/.]+$/, `.${finalFormat}`), 'songs');
    let fileUrl;
    try {
      fileUrl = await uploadFile(fileKey, compressedBuffer, `audio/${finalFormat}`);
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      // provide more helpful message for common misconfiguration
      if (s3Error.message && s3Error.message.includes('Failed to upload file')) {
        return res.status(500).json({ error: 'S3 upload failed. Check S3_ENDPOINT/S3_BUCKET/S3 credentials.' });
      }
      return res.status(500).json({ error: 'S3 upload failed', details: s3Error.message || String(s3Error) });
    }

    // Upload cover image if provided
    let coverImageUrl = null;
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const coverKey = generateFileKey(userId, req.files.coverImage[0].originalname, 'covers');
      coverImageUrl = await uploadFile(coverKey, req.files.coverImage[0].buffer, req.files.coverImage[0].mimetype);
    }

    const songId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert song
    await query(
      `INSERT INTO songs (id, artist_id, album_id, title, duration, file_url, file_size, file_format, cover_image_url, has_lyrics, approval_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [songId, artistId, albumId || null, title, duration, fileUrl, compressedBuffer.length, finalFormat, coverImageUrl, hasLyrics || false]
    );

    // Insert lyrics if provided
    if (hasLyrics && lyricsData) {
      const lyricsId = `lyrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const parsedLyrics = typeof lyricsData === 'string' ? JSON.parse(lyricsData) : lyricsData;
      
      await query(
        'INSERT INTO lyrics (id, song_id, is_realtime, lyrics_data) VALUES (?, ?, ?, ?)',
        [lyricsId, songId, parsedLyrics.isRealtime || false, JSON.stringify(parsedLyrics.data)]
      );
    }

    // Add tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const tagValues = tagIds.map(tagId => [songId, tagId, userId]);
      for (const value of tagValues) {
        try {
          await query(
            'INSERT INTO song_tags (song_id, tag_id, added_by) VALUES (?, ?, ?)',
            value
          );

          // Update tag usage count
          await query(
            'UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?',
            [value[1]]
          );
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.code === 'ER_DUP_ENTRY') {
            console.error('Error adding tag to song:', error);
          }
        }
      }
    }

    // Send pending notification email
    if (userEmail) {
      await sendSongPendingEmail(userEmail, artists[0].name, title);
    }

    // Create notification record
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await query(
      'INSERT INTO upload_notifications (id, user_id, user_email, song_id, notification_type) VALUES (?, ?, ?, ?, ?)',
      [notifId, userId, userEmail, songId, 'pending']
    );

    res.json({ 
      success: true, 
      songId,
      message: 'Song uploaded successfully and pending approval' 
    });
  } catch (error) {
    console.error('Error uploading song:', error);
    res.status(500).json({ error: 'Failed to upload song' });
  }
}

/**
 * Get all approved songs
 */
export async function getApprovedSongs(req, res) {
  try {
    const { limit = 50, offset = 0, artistId } = req.query;

    let queryStr = `
      SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image, al.title as album_title
      FROM songs s
      JOIN artists a ON s.artist_id = a.id
      LEFT JOIN albums al ON s.album_id = al.id
      WHERE s.approval_status = 'approved'
    `;
    const params = [];

    if (artistId) {
      queryStr += ' AND s.artist_id = ?';
      params.push(artistId);
    }

    queryStr += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const songs = await query(queryStr, params);

    // Generate signed URLs for audio files
    await addSignedUrls(songs);

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
}

/**
 * Get song with lyrics
 */
export async function getSongWithLyrics(req, res) {
  try {
    const { songId } = req.params;

    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image, al.title as album_title
       FROM songs s
       JOIN artists a ON s.artist_id = a.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE s.id = ? AND s.approval_status = 'approved'`,
      [songId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = songs[0];

    // Generate signed URL for audio file
    await addSignedUrls([song]);

    // Get lyrics if available
    if (song.has_lyrics) {
      const lyrics = await query(
        'SELECT * FROM lyrics WHERE song_id = ?',
        [songId]
      );

      if (lyrics.length > 0) {
        song.lyrics = {
          isRealtime: lyrics[0].is_realtime,
          data: JSON.parse(lyrics[0].lyrics_data)
        };
      }
    }

    res.json({ song });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
}

/**
 * Get pending songs for admin approval
 */
export async function getPendingSongs(req, res) {
  try {
    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.user_id as artist_user_id
       FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.approval_status = 'pending'
       ORDER BY s.created_at DESC`
    );

    // Generate signed URLs for audio files
    await addSignedUrls(songs);

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching pending songs:', error);
    res.status(500).json({ error: 'Failed to fetch pending songs' });
  }
}

/**
 * Approve a song (Admin only)
 */
export async function approveSong(req, res) {
  try {
    const { songId } = req.params;
    const adminUserId = req.userId;

    // Get song details
    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.user_id as artist_user_id
       FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ?`,
      [songId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = songs[0];

    // Update song status
    await query(
      'UPDATE songs SET approval_status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['approved', adminUserId, songId]
    );

    // Get user email from notification record
    const notifications = await query(
      'SELECT user_email FROM upload_notifications WHERE song_id = ? LIMIT 1',
      [songId]
    );

    if (notifications.length > 0) {
      const userEmail = notifications[0].user_email;
      await sendSongApprovedEmail(userEmail, song.artist_name, song.title);

      // Mark notification as sent
      await query(
        'UPDATE upload_notifications SET notification_type = ?, sent = TRUE, sent_at = NOW() WHERE song_id = ?',
        ['approved', songId]
      );
    }

    res.json({ 
      success: true, 
      message: 'Song approved successfully' 
    });
  } catch (error) {
    console.error('Error approving song:', error);
    res.status(500).json({ error: 'Failed to approve song' });
  }
}

/**
 * Reject a song (Admin only)
 */
export async function rejectSong(req, res) {
  try {
    const { songId } = req.params;
    const { reason } = req.body;

    // Get song details
    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.user_id as artist_user_id
       FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ?`,
      [songId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = songs[0];

    // Update song status
    await query(
      'UPDATE songs SET approval_status = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', reason, songId]
    );

    // Get user email from notification record
    const notifications = await query(
      'SELECT user_email FROM upload_notifications WHERE song_id = ? LIMIT 1',
      [songId]
    );

    if (notifications.length > 0) {
      const userEmail = notifications[0].user_email;
      await sendSongRejectedEmail(userEmail, song.artist_name, song.title, reason);

      // Mark notification as sent
      await query(
        'UPDATE upload_notifications SET notification_type = ?, sent = TRUE, sent_at = NOW() WHERE song_id = ?',
        ['rejected', songId]
      );
    }

    res.json({ 
      success: true, 
      message: 'Song rejected successfully' 
    });
  } catch (error) {
    console.error('Error rejecting song:', error);
    res.status(500).json({ error: 'Failed to reject song' });
  }
}

/**
 * Increment play count
 */
export async function incrementPlayCount(req, res) {
  try {
    const { songId } = req.params;

    await query(
      'UPDATE songs SET play_count = play_count + 1 WHERE id = ? AND approval_status = ?',
      [songId, 'approved']
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({ error: 'Failed to update play count' });
  }
}

/**
 * Like a song
 */
export async function likeSong(req, res) {
  try {
    const { songId } = req.params;
    const userId = req.userId;

    await query(
      'INSERT IGNORE INTO song_likes (user_id, song_id) VALUES (?, ?)',
      [userId, songId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error liking song:', error);
    res.status(500).json({ error: 'Failed to like song' });
  }
}

/**
 * Unlike a song
 */
export async function unlikeSong(req, res) {
  try {
    const { songId } = req.params;
    const userId = req.userId;

    await query(
      'DELETE FROM song_likes WHERE user_id = ? AND song_id = ?',
      [userId, songId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error unliking song:', error);
    res.status(500).json({ error: 'Failed to unlike song' });
  }
}

/**
 * Delete a song (artist only)
 */
export async function deleteSong(req, res) {
  try {
    const { songId } = req.params;
    const userId = req.userId;

    // Verify song belongs to artist
    const song = await query(
      `SELECT s.* FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ? AND a.user_id = ?`,
      [songId, userId]
    );

    if (song.length === 0) {
      return res.status(403).json({ error: 'Unauthorized - song not found or does not belong to you' });
    }

    // Delete file from S3
    if (song[0].file_url) {
      try {
        const url = new URL(song[0].file_url);
        const key = url.pathname.split('/').slice(2).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting file from S3:', error);
      }
    }

    // Delete cover image from S3 if exists
    if (song[0].cover_image_url) {
      try {
        const url = new URL(song[0].cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting cover image from S3:', error);
      }
    }

    // Delete from database
    await query('DELETE FROM song_likes WHERE song_id = ?', [songId]);
    await query('DELETE FROM playlist_songs WHERE song_id = ?', [songId]);
    await query('DELETE FROM lyrics WHERE song_id = ?', [songId]);
    await query('DELETE FROM songs WHERE id = ?', [songId]);

    res.json({ success: true, message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
}

/**
 * Get user's liked songs
 */
export async function getLikedSongs(req, res) {
  try {
    const userId = req.userId;

    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image, al.title as album_title
       FROM song_likes sl
       JOIN songs s ON sl.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE sl.user_id = ? AND s.approval_status = 'approved'
       ORDER BY sl.created_at DESC`,
      [userId]
    );

    // Generate signed URLs for audio files
    await addSignedUrls(songs);

    res.json({ songs });
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    res.status(500).json({ error: 'Failed to fetch liked songs' });
  }
}

/**
 * Report a song for moderation
 */
export async function reportSong(req, res) {
  try {
    const { reportType, description } = req.body;
    const { songId } = req.params;
    const userId = req.userId;

    if (!['copyright', 'explicit_content', 'harassment', 'spam', 'other'].includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    // Check if song exists
    const songs = await query('SELECT id FROM songs WHERE id = ?', [songId]);
    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if user already reported this song
    const existing = await query(
      'SELECT id FROM song_reports WHERE song_id = ? AND reporter_user_id = ?',
      [songId, userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reported this song' });
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await query(
      `INSERT INTO song_reports (id, song_id, reporter_user_id, report_type, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [reportId, songId, userId, reportType, description || null]
    );

    const report = await query('SELECT * FROM song_reports WHERE id = ?', [reportId]);
    
    res.json({
      success: true,
      message: 'Report submitted successfully',
      report: report[0]
    });
  } catch (error) {
    console.error('Error reporting song:', error);
    res.status(500).json({ error: 'Failed to report song' });
  }
}

/**
 * Get all pending reports (admin only)
 */
export async function getPendingReports(req, res) {
  try {
    const reports = await query(
      `SELECT sr.*, s.title as song_title, s.artist_id, a.name as artist_name
       FROM song_reports sr
       JOIN songs s ON sr.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       WHERE sr.status = 'pending'
       ORDER BY sr.created_at DESC`
    );

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

/**
 * Review/action a song report (admin only)
 */
export async function reviewReport(req, res) {
  try {
    const { reportId } = req.params;
    const { action, adminNotes } = req.body;
    const adminId = req.userId;

    if (!['dismiss', 'delete_song', 'ban_artist'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const reports = await query('SELECT * FROM song_reports WHERE id = ?', [reportId]);
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[0];
    const songs = await query('SELECT artist_id FROM songs WHERE id = ?', [report.song_id]);
    const artistId = songs[0].artist_id;

    let actionTaken = 'none';

    // Handle different actions
    if (action === 'delete_song') {
      await query('DELETE FROM songs WHERE id = ?', [report.song_id]);
      actionTaken = 'removed';
    } else if (action === 'ban_artist') {
      // Ban the artist
      await query(
        `UPDATE artists SET ban_status = 'permanent_ban', ban_reason = ?, banned_by = ?, banned_at = NOW()
         WHERE id = ?`,
        [`Content violation - Report #${reportId}`, adminId, artistId]
      );
      
      // Also delete the reported song
      await query('DELETE FROM songs WHERE id = ?', [report.song_id]);
      actionTaken = 'artist_banned';
    }

    // Update report status
    await query(
      `UPDATE song_reports SET status = 'resolved', action_taken = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [actionTaken, adminNotes || null, adminId, reportId]
    );

    res.json({
      success: true,
      message: `Report action completed: ${actionTaken}`
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({ error: 'Failed to review report' });
  }
}

/**
 * Delete any song (admin only)
 */
export async function adminDeleteSong(req, res) {
  try {
    const { songId } = req.params;
    const { reason } = req.body;
    const adminId = req.userId;

    const songs = await query('SELECT * FROM songs WHERE id = ?', [songId]);
    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const song = songs[0];

    // Delete S3 files
    if (song.file_url) {
      try {
        const url = new URL(song.file_url);
        const key = url.pathname.split('/').slice(2).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting audio file from S3:', error);
      }
    }

    if (song.cover_image_url) {
      try {
        const url = new URL(song.cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting cover image from S3:', error);
      }
    }

    // Delete song from database
    await query('DELETE FROM songs WHERE id = ?', [songId]);

    // Log admin action
    await query(
      `INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details)
       VALUES (?, 'delete_song', 'song', ?, ?)`,
      [adminId, songId, JSON.stringify({ reason })]
    );

    res.json({
      success: true,
      message: 'Song deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
}

/**
 * Ban an artist (admin only)
 */
export async function banArtist(req, res) {
  try {
    const { artistId } = req.params;
    const { banType, reason, banUntil } = req.body;
    const adminId = req.userId;

    if (!['temporary', 'permanent'].includes(banType)) {
      return res.status(400).json({ error: 'Invalid ban type' });
    }

    const artists = await query('SELECT * FROM artists WHERE id = ?', [artistId]);
    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const until = banType === 'temporary' ? new Date(banUntil) : null;

    // Update artist ban status
    await query(
      `UPDATE artists SET ban_status = ?, ban_reason = ?, ban_until = ?, banned_by = ?, banned_at = NOW()
       WHERE id = ?`,
      [
        banType === 'temporary' ? 'temporary_ban' : 'permanent_ban',
        reason,
        until,
        adminId,
        artistId
      ]
    );

    // Log in ban history
    await query(
      `INSERT INTO artist_bans (artist_id, ban_type, reason, ban_until, banned_by_admin_id)
       VALUES (?, ?, ?, ?, ?)`,
      [artistId, banType, reason, until, adminId]
    );

    // Log admin action
    await query(
      `INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details)
       VALUES (?, 'ban_artist', 'artist', ?, ?)`,
      [adminId, artistId, JSON.stringify({ banType, reason, banUntil: until })]
    );

    res.json({
      success: true,
      message: `Artist ${banType === 'temporary' ? 'temporarily' : 'permanently'} banned successfully`
    });
  } catch (error) {
    console.error('Error banning artist:', error);
    res.status(500).json({ error: 'Failed to ban artist' });
  }
}

/**
 * Unban an artist (admin only)
 */
export async function unbanArtist(req, res) {
  try {
    const { artistId } = req.params;
    const adminId = req.userId;

    const artists = await query('SELECT * FROM artists WHERE id = ?', [artistId]);
    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Update artist ban status
    await query(
      `UPDATE artists SET ban_status = 'active', ban_reason = NULL, ban_until = NULL
       WHERE id = ?`,
      [artistId]
    );

    // Log in ban history
    await query(
      `UPDATE artist_bans SET lifted_at = NOW()
       WHERE artist_id = ? AND lifted_at IS NULL`,
      [artistId]
    );

    // Log admin action
    await query(
      `INSERT INTO admin_actions_log (admin_id, action_type, target_type, target_id, details)
       VALUES (?, 'unban_artist', 'artist', ?, ?)`,
      [adminId, artistId, JSON.stringify({ reason: 'Manual unban' })]
    );

    res.json({
      success: true,
      message: 'Artist unbanned successfully'
    });
  } catch (error) {
    console.error('Error unbanning artist:', error);
    res.status(500).json({ error: 'Failed to unban artist' });
  }
}

/**
 * Get user's playlists
 */
export async function getMyPlaylists(req, res) {
  try {
    const userId = req.userId;

    const playlists = await query(
      `SELECT p.*, COUNT(ps.song_id) as song_count
       FROM playlists p
       LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // Generate signed URLs for cover images
    for (const playlist of playlists) {
      if (playlist.cover_image_url) {
        try {
          const url = new URL(playlist.cover_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          playlist.cover_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for playlist cover image:', error);
        }
      }
    }

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
}

/**
 * Get a specific playlist with songs
 */
export async function getPlaylist(req, res) {
  try {
    const { playlistId } = req.params;

    // Get playlist info
    const playlists = await query(
      `SELECT p.*, COUNT(ps.song_id) as song_count
       FROM playlists p
       LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [playlistId]
    );

    if (playlists.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const playlist = playlists[0];

    // Check if playlist is public or user owns it
    if (!playlist.is_public && playlist.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate signed URL for cover image
    if (playlist.cover_image_url) {
      try {
        const url = new URL(playlist.cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        playlist.cover_image_url = await getSignedFileUrl(key, 3600);
      } catch (error) {
        console.error('Error generating signed URL for playlist cover image:', error);
      }
    }

    // Get songs in playlist
    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image, al.title as album_title
       FROM playlist_songs ps
       JOIN songs s ON ps.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       LEFT JOIN albums al ON s.album_id = al.id
       WHERE ps.playlist_id = ? AND s.approval_status = 'approved'
       ORDER BY ps.position ASC`,
      [playlistId]
    );

    // Generate signed URLs for audio files
    await addSignedUrls(songs);

    playlist.songs = songs;

    res.json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
}

/**
 * Create a new playlist
 */
export async function createPlaylist(req, res) {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.userId;

    const playlistId = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle cover image upload if provided
    let coverImageUrl = null;
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const coverKey = generateFileKey(userId, req.files.coverImage[0].originalname, 'covers');
      coverImageUrl = await uploadFile(coverKey, req.files.coverImage[0].buffer, req.files.coverImage[0].mimetype);
    }

    await query(
      'INSERT INTO playlists (id, user_id, name, description, cover_image_url, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [playlistId, userId, name, description || null, coverImageUrl, isPublic || false]
    );

    const playlists = await query('SELECT * FROM playlists WHERE id = ?', [playlistId]);

    res.json({
      success: true,
      message: 'Playlist created successfully',
      playlist: playlists[0]
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
}

/**
 * Update a playlist
 */
export async function updatePlaylist(req, res) {
  try {
    const { playlistId } = req.params;
    const { name, description, isPublic } = req.body;
    const userId = req.userId;

    // Verify ownership
    const playlists = await query(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(403).json({ error: 'Playlist not found or access denied' });
    }

    const playlist = playlists[0];
    let coverImageUrl = playlist.cover_image_url;

    // Handle cover image upload if provided
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      // Delete old cover image if exists
      if (coverImageUrl) {
        try {
          const url = new URL(coverImageUrl);
          const key = url.pathname.split('/').slice(2).join('/');
          await deleteFile(key);
        } catch (error) {
          console.error('Error deleting old cover image:', error);
        }
      }

      const coverKey = generateFileKey(userId, req.files.coverImage[0].originalname, 'covers');
      coverImageUrl = await uploadFile(coverKey, req.files.coverImage[0].buffer, req.files.coverImage[0].mimetype);
    }

    await query(
      'UPDATE playlists SET name = ?, description = ?, cover_image_url = ?, is_public = ? WHERE id = ?',
      [name || playlist.name, description || playlist.description, coverImageUrl, isPublic !== undefined ? isPublic : playlist.is_public, playlistId]
    );

    const updated = await query('SELECT * FROM playlists WHERE id = ?', [playlistId]);

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      playlist: updated[0]
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(req, res) {
  try {
    const { playlistId } = req.params;
    const userId = req.userId;

    // Verify ownership
    const playlists = await query(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(403).json({ error: 'Playlist not found or access denied' });
    }

    const playlist = playlists[0];

    // Delete cover image from S3 if exists
    if (playlist.cover_image_url) {
      try {
        const url = new URL(playlist.cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting playlist cover image from S3:', error);
      }
    }

    // Delete playlist (cascade will delete playlist_songs)
    await query('DELETE FROM playlists WHERE id = ?', [playlistId]);

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
}

/**
 * Add a song to a playlist
 */
export async function addSongToPlaylist(req, res) {
  try {
    const { playlistId } = req.params;
    const { songId } = req.body;
    const userId = req.userId;

    // Verify playlist ownership
    const playlists = await query(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(403).json({ error: 'Playlist not found or access denied' });
    }

    // Verify song exists and is approved
    const songs = await query(
      'SELECT id FROM songs WHERE id = ? AND approval_status = ?',
      [songId, 'approved']
    );

    if (songs.length === 0) {
      return res.status(404).json({ error: 'Song not found or not approved' });
    }

    // Get next position
    const positions = await query(
      'SELECT MAX(position) as max_pos FROM playlist_songs WHERE playlist_id = ?',
      [playlistId]
    );

    const nextPosition = (positions[0].max_pos || 0) + 1;

    // Add song to playlist
    await query(
      'INSERT IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
      [playlistId, songId, nextPosition]
    );

    res.json({
      success: true,
      message: 'Song added to playlist successfully'
    });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ error: 'Failed to add song to playlist' });
  }
}

/**
 * Get all tag categories
 */
export async function getTagCategories(req, res) {
  try {
    const categories = await query('SELECT * FROM tag_categories ORDER BY name ASC');
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching tag categories:', error);
    res.status(500).json({ error: 'Failed to fetch tag categories' });
  }
}

/**
 * Get tags by category
 */
export async function getTagsByCategory(req, res) {
  try {
    const { categoryId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const tags = await query(
      'SELECT * FROM tags WHERE category_id = ? ORDER BY usage_count DESC, name ASC LIMIT ? OFFSET ?',
      [categoryId, parseInt(limit), parseInt(offset)]
    );

    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags by category:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
}

/**
 * Search tags
 */
export async function searchTags(req, res) {
  try {
    const { q, categoryId } = req.query;
    const { limit = 20 } = req.query;

    let queryStr = `
      SELECT t.*, tc.name as category_name
      FROM tags t
      JOIN tag_categories tc ON t.category_id = tc.id
      WHERE t.name LIKE ?
    `;
    const params = [`%${q}%`];

    if (categoryId) {
      queryStr += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    queryStr += ' ORDER BY t.usage_count DESC, t.name ASC LIMIT ?';
    params.push(parseInt(limit));

    const tags = await query(queryStr, params);
    res.json({ tags });
  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({ error: 'Failed to search tags' });
  }
}

/**
 * Create a new tag
 */
export async function createTag(req, res) {
  try {
    const { name, categoryId } = req.body;
    const userId = req.userId;

    // Check if tag already exists
    const existing = await query(
      'SELECT * FROM tags WHERE name = ? AND category_id = ?',
      [name, categoryId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Tag already exists in this category' });
    }

    const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await query(
      'INSERT INTO tags (id, name, category_id, created_by) VALUES (?, ?, ?, ?)',
      [tagId, name, categoryId, userId]
    );

    const tags = await query('SELECT * FROM tags WHERE id = ?', [tagId]);
    res.json({ success: true, tag: tags[0] });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
}

/**
 * Get tags for a song
 */
export async function getSongTags(req, res) {
  try {
    const { songId } = req.params;

    const tags = await query(
      `SELECT t.*, tc.name as category_name
       FROM song_tags st
       JOIN tags t ON st.tag_id = t.id
       JOIN tag_categories tc ON t.category_id = tc.id
       WHERE st.song_id = ?
       ORDER BY tc.name ASC, t.name ASC`,
      [songId]
    );

    res.json({ tags });
  } catch (error) {
    console.error('Error fetching song tags:', error);
    res.status(500).json({ error: 'Failed to fetch song tags' });
  }
}

/**
 * Add tags to a song
 */
export async function addTagsToSong(req, res) {
  try {
    const { songId } = req.params;
    const { tagIds } = req.body;
    const userId = req.userId;

    // Verify song exists and user has permission
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ? AND (a.user_id = ? OR ? = 'admin')`,
      [songId, userId, req.userRole]
    );

    if (songs.length === 0) {
      return res.status(403).json({ error: 'Song not found or access denied' });
    }

    const addedTags = [];

    for (const tagId of tagIds) {
      try {
        await query(
          'INSERT IGNORE INTO song_tags (song_id, tag_id, added_by) VALUES (?, ?, ?)',
          [songId, tagId, userId]
        );

        // Update tag usage count
        await query(
          'UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?',
          [tagId]
        );

        // Get tag info
        const tags = await query('SELECT * FROM tags WHERE id = ?', [tagId]);
        if (tags.length > 0) {
          addedTags.push(tags[0]);
        }
      } catch (error) {
        // Ignore duplicate key errors
        if (!error.code === 'ER_DUP_ENTRY') {
          console.error('Error adding tag to song:', error);
        }
      }
    }

    res.json({ success: true, addedTags });
  } catch (error) {
    console.error('Error adding tags to song:', error);
    res.status(500).json({ error: 'Failed to add tags to song' });
  }
}

/**
 * Remove a tag from a song
 */
export async function removeTagFromSong(req, res) {
  try {
    const { songId, tagId } = req.params;
    const userId = req.userId;

    // Verify song exists and user has permission
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ? AND (a.user_id = ? OR ? = 'admin')`,
      [songId, userId, req.userRole]
    );

    if (songs.length === 0) {
      return res.status(403).json({ error: 'Song not found or access denied' });
    }

    await query(
      'DELETE FROM song_tags WHERE song_id = ? AND tag_id = ?',
      [songId, tagId]
    );

    // Update tag usage count
    await query(
      'UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = ?',
      [tagId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from song:', error);
    res.status(500).json({ error: 'Failed to remove tag from song' });
  }
}

/**
 * Update user tag preference
 */
export async function updateUserTagPreference(req, res) {
  try {
    const { tagId } = req.params;
    const { preference } = req.body; // 'like', 'dislike', or 'neutral'
    const userId = req.userId;

    if (!['like', 'dislike', 'neutral'].includes(preference)) {
      return res.status(400).json({ error: 'Invalid preference value' });
    }

    // Remove existing preference
    await query(
      'DELETE FROM user_tag_preferences WHERE user_id = ? AND tag_id = ?',
      [userId, tagId]
    );

    // Add new preference if not neutral
    if (preference !== 'neutral') {
      await query(
        'INSERT INTO user_tag_preferences (user_id, tag_id, preference) VALUES (?, ?, ?)',
        [userId, tagId, preference]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tag preference:', error);
    res.status(500).json({ error: 'Failed to update tag preference' });
  }
}

/**
 * Get user tag preferences
 */
export async function getUserTagPreferences(req, res) {
  try {
    const userId = req.userId;

    const preferences = await query(
      `SELECT utp.*, t.name as tag_name, tc.name as category_name
       FROM user_tag_preferences utp
       JOIN tags t ON utp.tag_id = t.id
       JOIN tag_categories tc ON t.category_id = tc.id
       WHERE utp.user_id = ?
       ORDER BY tc.name ASC, t.name ASC`,
      [userId]
    );

    res.json({ preferences });
  } catch (error) {
    console.error('Error fetching tag preferences:', error);
    res.status(500).json({ error: 'Failed to fetch tag preferences' });
  }
}

/**
 * Remove a song from a playlist
 */
export async function removeSongFromPlaylist(req, res) {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.userId;

    // Verify playlist ownership
    const playlists = await query(
      'SELECT * FROM playlists WHERE id = ? AND user_id = ?',
      [playlistId, userId]
    );

    if (playlists.length === 0) {
      return res.status(403).json({ error: 'Playlist not found or access denied' });
    }

    // Remove song from playlist
    await query(
      'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
      [playlistId, songId]
    );

    // Reorder remaining songs
    const remainingSongs = await query(
      'SELECT song_id FROM playlist_songs WHERE playlist_id = ? ORDER BY position ASC',
      [playlistId]
    );

    // Update positions
    for (let i = 0; i < remainingSongs.length; i++) {
      await query(
        'UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?',
        [i + 1, playlistId, remainingSongs[i].song_id]
      );
    }

    res.json({
      success: true,
      message: 'Song removed from playlist successfully'
    });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({ error: 'Failed to remove song from playlist' });
  }
}

/**
 * Get recommended songs for user
 */
export async function getRecommendedSongs(req, res) {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    // Get user's liked songs and their tags
    const likedSongTags = await query(
      `SELECT DISTINCT t.id, t.name, COUNT(*) as weight
       FROM song_likes sl
       JOIN song_tags st ON sl.song_id = st.song_id
       JOIN tags t ON st.tag_id = t.id
       WHERE sl.user_id = ?
       GROUP BY t.id, t.name
       ORDER BY weight DESC
       LIMIT 10`,
      [userId]
    );

    if (likedSongTags.length === 0) {
      // If no liked songs with tags, return popular songs
      const popularSongs = await query(
        `SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image
         FROM songs s
         JOIN artists a ON s.artist_id = a.id
         WHERE s.approval_status = 'approved'
         ORDER BY s.play_count DESC
         LIMIT ?`,
        [parseInt(limit)]
      );

      await addSignedUrls(popularSongs);
      return res.json({ songs: popularSongs });
    }

    // Get songs with similar tags, excluding already liked songs
    const tagIds = likedSongTags.map(tag => tag.id);
    const placeholders = tagIds.map(() => '?').join(',');

    const recommendedSongs = await query(
      `SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image,
              COUNT(st.tag_id) as matching_tags
       FROM songs s
       JOIN artists a ON s.artist_id = a.id
       JOIN song_tags st ON s.id = st.song_id
       WHERE s.approval_status = 'approved'
       AND st.tag_id IN (${placeholders})
       AND s.id NOT IN (
         SELECT song_id FROM song_likes WHERE user_id = ?
       )
       GROUP BY s.id
       ORDER BY matching_tags DESC, s.play_count DESC
       LIMIT ?`,
      [...tagIds, userId, parseInt(limit)]
    );

    await addSignedUrls(recommendedSongs);
    res.json({ songs: recommendedSongs });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

/**
 * Update song metadata (story, social media, copyright)
 */
export async function updateSongMetadata(req, res) {
  try {
    const { songId } = req.params;
    const {
      story,
      copyrightInfo,
      socialInstagram,
      socialTwitter,
      socialTiktok,
      socialYoutube,
      socialSpotify,
      socialAppleMusic
    } = req.body;
    const userId = req.userId;

    // Verify song belongs to user
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ? AND a.user_id = ?`,
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(403).json({ error: 'Song not found or access denied' });
    }

    // Update song metadata
    await query(
      `UPDATE songs SET
        story = ?,
        copyright_info = ?,
        social_instagram = ?,
        social_twitter = ?,
        social_tiktok = ?,
        social_youtube = ?,
        social_spotify = ?,
        social_apple_music = ?,
        last_edited_at = NOW(),
        edited_by = ?
       WHERE id = ?`,
      [
        story,
        copyrightInfo,
        socialInstagram,
        socialTwitter,
        socialTiktok,
        socialYoutube,
        socialSpotify,
        socialAppleMusic,
        userId,
        songId
      ]
    );

    res.json({ success: true, message: 'Song metadata updated successfully' });
  } catch (error) {
    console.error('Error updating song metadata:', error);
    res.status(500).json({ error: 'Failed to update song metadata' });
  }
}

/**
 * Add collaborator to song
 */
export async function addSongCollaborator(req, res) {
  try {
    const { songId } = req.params;
    const { name, role, email, social } = req.body;
    const userId = req.userId;

    // Verify song belongs to user
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ? AND a.user_id = ?`,
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(403).json({ error: 'Song not found or access denied' });
    }

    const collaboratorId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await query(
      'INSERT INTO song_collaborators (id, song_id, collaborator_name, collaborator_role, collaborator_email, collaborator_social) VALUES (?, ?, ?, ?, ?, ?)',
      [collaboratorId, songId, name, role, email || null, social || null]
    );

    res.json({ success: true, collaboratorId, message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
}

/**
 * Get song collaborators
 */
export async function getSongCollaborators(req, res) {
  try {
    const { songId } = req.params;

    const collaborators = await query(
      'SELECT * FROM song_collaborators WHERE song_id = ? ORDER BY created_at ASC',
      [songId]
    );

    res.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
}

/**
 * Remove song collaborator
 */
export async function removeSongCollaborator(req, res) {
  try {
    const { songId, collaboratorId } = req.params;
    const userId = req.userId;

    // Verify song belongs to user
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.id = ? AND a.user_id = ?`,
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(403).json({ error: 'Song not found or access denied' });
    }

    await query(
      'DELETE FROM song_collaborators WHERE id = ? AND song_id = ?',
      [collaboratorId, songId]
    );

    res.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
}

/**
 * Follow an artist
 */
export async function followArtist(req, res) {
  try {
    const { artistId } = req.params;
    const userId = req.userId;

    // Check if artist exists
    const artists = await query('SELECT id FROM artists WHERE id = ?', [artistId]);
    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Add follow relationship
    await query(
      'INSERT IGNORE INTO artist_followers (id, artist_id, user_id) VALUES (?, ?, ?)',
      [`follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, artistId, userId]
    );

    // Update artist follower count
    await query(
      'UPDATE artists SET followers_count = (SELECT COUNT(*) FROM artist_followers WHERE artist_id = ?) WHERE id = ?',
      [artistId, artistId]
    );

    res.json({ success: true, message: 'Artist followed successfully' });
  } catch (error) {
    console.error('Error following artist:', error);
    res.status(500).json({ error: 'Failed to follow artist' });
  }
}

/**
 * Unfollow an artist
 */
export async function unfollowArtist(req, res) {
  try {
    const { artistId } = req.params;
    const userId = req.userId;

    await query(
      'DELETE FROM artist_followers WHERE artist_id = ? AND user_id = ?',
      [artistId, userId]
    );

    // Update artist follower count
    await query(
      'UPDATE artists SET followers_count = (SELECT COUNT(*) FROM artist_followers WHERE artist_id = ?) WHERE id = ?',
      [artistId, artistId]
    );

    res.json({ success: true, message: 'Artist unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing artist:', error);
    res.status(500).json({ error: 'Failed to unfollow artist' });
  }
}

/**
 * Check if user follows artist
 */
export async function checkFollowStatus(req, res) {
  try {
    const { artistId } = req.params;
    const userId = req.userId;

    const follows = await query(
      'SELECT id FROM artist_followers WHERE artist_id = ? AND user_id = ?',
      [artistId, userId]
    );

    res.json({ isFollowing: follows.length > 0 });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
}

/**
 * Get user's followed artists
 */
export async function getFollowedArtists(req, res) {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const artists = await query(
      `SELECT a.*, af.followed_at
       FROM artists a
       JOIN artist_followers af ON a.id = af.artist_id
       WHERE af.user_id = ?
       ORDER BY af.followed_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Generate signed URLs for images
    for (const artist of artists) {
      if (artist.profile_image_url) {
        try {
          const url = new URL(artist.profile_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          artist.profile_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for artist profile image:', error);
        }
      }
      if (artist.cover_image_url) {
        try {
          const url = new URL(artist.cover_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          artist.cover_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for artist cover image:', error);
        }
      }
    }

    res.json({ artists });
  } catch (error) {
    console.error('Error fetching followed artists:', error);
    res.status(500).json({ error: 'Failed to fetch followed artists' });
  }
}

/**
 * Get song statistics
 */
export async function getSongStatistics(req, res) {
  try {
    const { songId } = req.params;
    const { days = 30 } = req.query;

    const stats = await query(
      `SELECT
        SUM(plays_count) as total_plays,
        SUM(likes_count) as total_likes,
        SUM(shares_count) as total_shares,
        SUM(saves_count) as total_saves,
        AVG(plays_count) as avg_daily_plays,
        MAX(plays_count) as peak_daily_plays,
        COUNT(*) as days_tracked
       FROM song_statistics
       WHERE song_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [songId, parseInt(days)]
    );

    const dailyStats = await query(
      `SELECT date, plays_count, likes_count, shares_count, saves_count
       FROM song_statistics
       WHERE song_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY date ASC`,
      [songId, parseInt(days)]
    );

    res.json({
      summary: stats[0] || {
        total_plays: 0,
        total_likes: 0,
        total_shares: 0,
        total_saves: 0,
        avg_daily_plays: 0,
        peak_daily_plays: 0,
        days_tracked: 0
      },
      daily: dailyStats
    });
  } catch (error) {
    console.error('Error fetching song statistics:', error);
    res.status(500).json({ error: 'Failed to fetch song statistics' });
  }
}

/**
 * Get artist statistics
 */
export async function getArtistStatistics(req, res) {
  try {
    const { artistId } = req.params;
    const { days = 30 } = req.query;

    const stats = await query(
      `SELECT
        SUM(profile_views) as total_profile_views,
        SUM(followers_gained) as total_followers_gained,
        SUM(song_plays) as total_song_plays,
        MAX(total_followers) as current_followers,
        AVG(profile_views) as avg_daily_views,
        COUNT(*) as days_tracked
       FROM artist_statistics
       WHERE artist_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [artistId, parseInt(days)]
    );

    const dailyStats = await query(
      `SELECT date, profile_views, followers_gained, song_plays, total_followers
       FROM artist_statistics
       WHERE artist_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY date ASC`,
      [artistId, parseInt(days)]
    );

    res.json({
      summary: stats[0] || {
        total_profile_views: 0,
        total_followers_gained: 0,
        total_song_plays: 0,
        current_followers: 0,
        avg_daily_views: 0,
        days_tracked: 0
      },
      daily: dailyStats
    });
  } catch (error) {
    console.error('Error fetching artist statistics:', error);
    res.status(500).json({ error: 'Failed to fetch artist statistics' });
  }
}

/**
 * Update artist profile with social media and additional info
 */
export async function updateArtistProfile(req, res) {
  try {
    const userId = req.userId;
    const {
      biography,
      location,
      website,
      socialInstagram,
      socialTwitter,
      socialTiktok,
      socialYoutube,
      socialSpotify,
      socialAppleMusic
    } = req.body;

    // Get current artist
    const artists = await query(
      'SELECT * FROM artists WHERE user_id = ?',
      [userId]
    );

    if (artists.length === 0) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    const artistId = artists[0].id;

    // Update artist profile
    await query(
      `UPDATE artists SET
        biography = ?,
        location = ?,
        website = ?,
        social_instagram = ?,
        social_twitter = ?,
        social_tiktok = ?,
        social_youtube = ?,
        social_spotify = ?,
        social_apple_music = ?
       WHERE id = ?`,
      [
        biography,
        location,
        website,
        socialInstagram,
        socialTwitter,
        socialTiktok,
        socialYoutube,
        socialSpotify,
        socialAppleMusic,
        artistId
      ]
    );

    const updated = await query('SELECT * FROM artists WHERE id = ?', [artistId]);

    res.json({
      success: true,
      message: 'Artist profile updated',
      artist: updated[0]
    });
  } catch (error) {
    console.error('Error updating artist profile:', error);
    res.status(500).json({ error: 'Failed to update artist profile' });
  }
}

/**
 * Create a new album
 */
export async function createAlbum(req, res) {
  try {
    const userId = req.userId;
    const { title, description, releaseDate } = req.body;

    // Get artist profile
    const artists = await query(
      'SELECT id FROM artists WHERE user_id = ?',
      [userId]
    );

    if (artists.length === 0) {
      return res.status(403).json({ error: 'Artist profile required to create albums' });
    }

    const artistId = artists[0].id;
    const albumId = `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let coverImageUrl = null;

    // Handle cover image upload
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const coverImageFile = req.files.coverImage[0];
      const coverImageKey = `albums/${albumId}/cover/${Date.now()}_${coverImageFile.originalname}`;
      coverImageUrl = await uploadFile(coverImageKey, coverImageFile.buffer, coverImageFile.mimetype);
    }

    await query(
      'INSERT INTO albums (id, artist_id, title, description, cover_image_url, release_date) VALUES (?, ?, ?, ?, ?, ?)',
      [albumId, artistId, title, description || null, coverImageUrl, releaseDate || null]
    );

    const albums = await query('SELECT * FROM albums WHERE id = ?', [albumId]);
    res.json({ success: true, album: albums[0], message: 'Album created successfully' });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
}

/**
 * Get artist's albums
 */
export async function getMyAlbums(req, res) {
  try {
    const userId = req.userId;

    // Get artist profile
    const artists = await query(
      'SELECT id FROM artists WHERE user_id = ?',
      [userId]
    );

    if (artists.length === 0) {
      return res.json({ albums: [] });
    }

    const artistId = artists[0].id;

    const albums = await query(
      `SELECT a.*,
              COUNT(s.id) as song_count,
              SUM(s.duration) as total_duration
       FROM albums a
       LEFT JOIN songs s ON a.id = s.album_id AND s.approval_status = 'approved'
       WHERE a.artist_id = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [artistId]
    );

    // Generate signed URLs for cover images
    for (const album of albums) {
      if (album.cover_image_url) {
        try {
          const url = new URL(album.cover_image_url);
          const key = url.pathname.split('/').slice(2).join('/');
          album.cover_image_url = await getSignedFileUrl(key, 3600);
        } catch (error) {
          console.error('Error generating signed URL for album cover:', error);
        }
      }
    }

    res.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
}

/**
 * Get album by ID with songs
 */
export async function getAlbum(req, res) {
  try {
    const { albumId } = req.params;

    const albums = await query(
      `SELECT a.*,
              art.name as artist_name,
              art.profile_image_url as artist_image,
              COUNT(s.id) as song_count,
              SUM(s.duration) as total_duration
       FROM albums a
       JOIN artists art ON a.artist_id = art.id
       LEFT JOIN songs s ON a.id = s.album_id AND s.approval_status = 'approved'
       WHERE a.id = ?
       GROUP BY a.id`,
      [albumId]
    );

    if (albums.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = albums[0];

    // Get songs for this album
    const songs = await query(
      `SELECT s.*, a.name as artist_name, a.profile_image_url as artist_image
       FROM songs s
       JOIN artists a ON s.artist_id = a.id
       WHERE s.album_id = ? AND s.approval_status = 'approved'
       ORDER BY s.created_at ASC`,
      [albumId]
    );

    // Generate signed URLs
    if (album.cover_image_url) {
      try {
        const url = new URL(album.cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        album.cover_image_url = await getSignedFileUrl(key, 3600);
      } catch (error) {
        console.error('Error generating signed URL for album cover:', error);
      }
    }

    await addSignedUrls(songs);

    res.json({ album, songs });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
}

/**
 * Update album
 */
export async function updateAlbum(req, res) {
  try {
    const { albumId } = req.params;
    const userId = req.userId;
    const { title, description, releaseDate } = req.body;

    // Verify album ownership
    const albums = await query(
      `SELECT a.* FROM albums a
       JOIN artists art ON a.artist_id = art.id
       WHERE a.id = ? AND art.user_id = ?`,
      [albumId, userId]
    );

    if (albums.length === 0) {
      return res.status(403).json({ error: 'Album not found or access denied' });
    }

    const album = albums[0];
    let coverImageUrl = album.cover_image_url;

    // Handle cover image upload
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const coverImageFile = req.files.coverImage[0];
      const coverImageKey = `albums/${albumId}/cover/${Date.now()}_${coverImageFile.originalname}`;

      // Delete old cover image if exists
      if (album.cover_image_url) {
        try {
          const oldUrl = new URL(album.cover_image_url);
          const oldKey = oldUrl.pathname.split('/').slice(2).join('/');
          await deleteFile(oldKey);
        } catch (error) {
          console.error('Error deleting old album cover image:', error);
        }
      }

      coverImageUrl = await uploadFile(coverImageKey, coverImageFile.buffer, coverImageFile.mimetype);
    }

    await query(
      'UPDATE albums SET title = ?, description = ?, cover_image_url = ?, release_date = ? WHERE id = ?',
      [title, description || null, coverImageUrl, releaseDate || null, albumId]
    );

    const updated = await query('SELECT * FROM albums WHERE id = ?', [albumId]);
    res.json({ success: true, album: updated[0], message: 'Album updated successfully' });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
}

/**
 * Delete album
 */
export async function deleteAlbum(req, res) {
  try {
    const { albumId } = req.params;
    const userId = req.userId;

    // Verify album ownership
    const albums = await query(
      `SELECT a.* FROM albums a
       JOIN artists art ON a.artist_id = art.id
       WHERE a.id = ? AND art.user_id = ?`,
      [albumId, userId]
    );

    if (albums.length === 0) {
      return res.status(403).json({ error: 'Album not found or access denied' });
    }

    const album = albums[0];

    // Delete cover image from S3 if exists
    if (album.cover_image_url) {
      try {
        const url = new URL(album.cover_image_url);
        const key = url.pathname.split('/').slice(2).join('/');
        await deleteFile(key);
      } catch (error) {
        console.error('Error deleting album cover image from S3:', error);
      }
    }

    // Delete album (songs will have album_id set to NULL due to foreign key constraint)
    await query('DELETE FROM albums WHERE id = ?', [albumId]);

    res.json({ success: true, message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
}

/**
 * Add song to album
 */
export async function addSongToAlbum(req, res) {
  try {
    const { albumId } = req.params;
    const { songId } = req.body;
    const userId = req.userId;

    // Verify album ownership
    const albums = await query(
      `SELECT a.* FROM albums a
       JOIN artists art ON a.artist_id = art.id
       WHERE a.id = ? AND art.user_id = ?`,
      [albumId, userId]
    );

    if (albums.length === 0) {
      return res.status(403).json({ error: 'Album not found or access denied' });
    }

    // Verify song ownership
    const songs = await query(
      `SELECT s.* FROM songs s
       JOIN artists art ON s.artist_id = art.id
       WHERE s.id = ? AND art.user_id = ?`,
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(403).json({ error: 'Song not found or access denied' });
    }

    // Update song's album_id
    await query(
      'UPDATE songs SET album_id = ? WHERE id = ?',
      [albumId, songId]
    );

    res.json({ success: true, message: 'Song added to album successfully' });
  } catch (error) {
    console.error('Error adding song to album:', error);
    res.status(500).json({ error: 'Failed to add song to album' });
  }
}

/**
 * Remove song from album
 */
export async function removeSongFromAlbum(req, res) {
  try {
    const { albumId, songId } = req.params;
    const userId = req.userId;

    // Verify album ownership
    const albums = await query(
      `SELECT a.* FROM albums a
       JOIN artists art ON a.artist_id = art.id
       WHERE a.id = ? AND art.user_id = ?`,
      [albumId, userId]
    );

    if (albums.length === 0) {
      return res.status(403).json({ error: 'Album not found or access denied' });
    }

    // Remove song from album (set album_id to NULL)
    await query(
      'UPDATE songs SET album_id = NULL WHERE id = ? AND album_id = ?',
      [songId, albumId]
    );

    res.json({ success: true, message: 'Song removed from album successfully' });
  } catch (error) {
    console.error('Error removing song from album:', error);
    res.status(500).json({ error: 'Failed to remove song from album' });
  }
}

export default {
  createArtist,
  getArtistByUserId,
  getAllArtists,
  updateArtist,
  uploadSong,
  getApprovedSongs,
  getSongWithLyrics,
  getPendingSongs,
  approveSong,
  rejectSong,
  incrementPlayCount,
  likeSong,
  unlikeSong,
  getLikedSongs,
  deleteSong,
  reportSong,
  getPendingReports,
  reviewReport,
  adminDeleteSong,
  banArtist,
  unbanArtist,
  getMyPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  // Tags system
  getTagCategories,
  getTagsByCategory,
  searchTags,
  createTag,
  getSongTags,
  addTagsToSong,
  removeTagFromSong,
  updateUserTagPreference,
  getUserTagPreferences,
  getRecommendedSongs,
  // Enhanced song features
  updateSongMetadata,
  addSongCollaborator,
  getSongCollaborators,
  removeSongCollaborator,
  followArtist,
  unfollowArtist,
  checkFollowStatus,
  getFollowedArtists,
  getSongStatistics,
  getArtistStatistics,
  updateArtistProfile,
  // Album functions
  createAlbum,
  getMyAlbums,
  getAlbum,
  updateAlbum,
  deleteAlbum,
  addSongToAlbum,
  removeSongFromAlbum,
  // Playlist functions
  getMyPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
};
