import { env } from './env';

const API_BASE_URL = env.API_URL || 'http://localhost:3001/api';

export interface Artist {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  verified: boolean;
  followers_count: number;
  created_at: string;
  updated_at: string;
  // Enhanced fields
  social_links?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
}

export interface Song {
  id: string;
  artist_id: string;
  album_id?: string;
  title: string;
  duration: number;
  file_url: string;
  file_size?: number;
  file_format?: string;
  cover_image_url?: string;
  has_lyrics: boolean;
  play_count: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  artist_name?: string;
  artist_image?: string;
  album_title?: string;
  lyrics?: {
    isRealtime: boolean;
    data: any;
  };
  // Enhanced fields
  story?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  copyright_info?: string;
  is_owner?: boolean;
}

export interface LyricsData {
  isRealtime: boolean;
  data: string | Array<{ timestamp: number; text: string }>;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  song_count?: number;
}

export interface Album {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  release_date?: string;
  created_at: string;
  updated_at: string;
  song_count?: number;
  total_duration?: number;
  artist_name?: string;
  artist_image?: string;
}

export interface SongReport {
  id: string;
  song_id: string;
  reporter_user_id: string;
  report_type: 'copyright' | 'explicit_content' | 'harassment' | 'spam' | 'other';
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  action_taken: 'none' | 'warning' | 'removed' | 'artist_banned';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  song?: Song;
  song_title?: string;
  artist_id?: string;
  artist_name?: string;
}

/**
 * Create a new artist profile
 */
export async function createArtist(
  data: { name: string; bio?: string; profileImage?: File | null; coverImage?: File | null; backgroundImage?: File | null },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; artistId: string; message: string }> {
  const token = await getToken();
  
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.bio) formData.append('bio', data.bio);
  if (data.profileImage) formData.append('profileImage', data.profileImage);
  if (data.coverImage) formData.append('coverImage', data.coverImage);
  if (data.backgroundImage) formData.append('backgroundImage', data.backgroundImage);

  const response = await fetch(`${API_BASE_URL}/music/artists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create artist profile');
  }

  return response.json();
}

/**
 * Get current user's artist profile
 */
export async function getMyArtistProfile(
  getToken: () => Promise<string | null>
): Promise<{ artist: Artist | null }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/artists/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch artist profile');
  }

  return response.json();
}

/**
 * Get all artists
 */
export async function getAllArtists(
  limit: number = 50,
  offset: number = 0
): Promise<{ artists: Artist[] }> {
  const response = await fetch(
    `${API_BASE_URL}/music/artists?limit=${limit}&offset=${offset}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch artists');
  }

  return response.json();
}

/**
 * Upload a song
 */
export async function uploadSong(
  data: {
    artistId: string;
    title: string;
    albumId?: string;
    duration: number;
    audioFile: File;
    coverImage?: File | null;
    hasLyrics?: boolean;
    lyricsData?: LyricsData;
    userEmail?: string;
    tagIds?: number[];
  },
  getToken: () => Promise<string | null>,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; songId: string; message: string }> {
  const token = await getToken();
  
  const formData = new FormData();
  formData.append('artistId', data.artistId);
  formData.append('title', data.title);
  if (data.albumId) formData.append('albumId', data.albumId);
  formData.append('duration', data.duration.toString());
  formData.append('audioFile', data.audioFile);
  if (data.coverImage) formData.append('coverImage', data.coverImage);
  if (data.hasLyrics) formData.append('hasLyrics', 'true');
  if (data.lyricsData) formData.append('lyricsData', JSON.stringify(data.lyricsData));
  if (data.userEmail) formData.append('userEmail', data.userEmail);
  if (data.tagIds && data.tagIds.length > 0) formData.append('tagIds', JSON.stringify(data.tagIds));

  const response = await fetch(`${API_BASE_URL}/music/songs/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload song');
  }

  return response.json();
}

/**
 * Get approved songs
 */
export async function getApprovedSongs(
  limit: number = 50,
  offset: number = 0,
  artistId?: string
): Promise<{ songs: Song[] }> {
  let url = `${API_BASE_URL}/music/songs?limit=${limit}&offset=${offset}`;
  if (artistId) url += `&artistId=${artistId}`;

  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch songs');
  }

  return response.json();
}

/**
 * Get song with lyrics
 */
export async function getSongWithLyrics(songId: string): Promise<{ song: Song }> {
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch song');
  }

  return response.json();
}

/**
 * Increment play count
 */
export async function incrementPlayCount(songId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/music/songs/${songId}/play`, {
    method: 'POST',
  });
}

/**
 * Like a song
 */
export async function likeSong(
  songId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to like song');
  }
}

/**
 * Unlike a song
 */
export async function unlikeSong(
  songId: string,
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/like`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unlike song');
  }
}

/**
 * Get user's liked songs
 */
export async function getLikedSongs(
  getToken: () => Promise<string | null>
): Promise<{ songs: Song[] }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/liked`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch liked songs');
  }

  return response.json();
}

/**
 * Get pending songs (Admin only)
 */
export async function getPendingSongs(
  getToken: () => Promise<string | null>
): Promise<{ songs: Song[] }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/songs/pending`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch pending songs');
  }

  return response.json();
}

/**
 * Approve a song (Admin only)
 */
export async function approveSong(
  songId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/songs/${songId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve song');
  }

  return response.json();
}

/**
 * Reject a song (Admin only)
 */
export async function rejectSong(
  songId: string,
  reason: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/songs/${songId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject song');
  }

  return response.json();
}

/**
 * Delete a song (Artist only)
 */
export async function deleteSong(
  songId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete song');
  }

  return response.json();
}

/**
 * Update artist profile
 */
export async function updateArtist(
  data: {
    name?: string;
    bio?: string;
    profileImage?: File;
    coverImage?: File;
    backgroundImage?: File;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; artist: Artist }> {
  const token = await getToken();
  
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.bio) formData.append('bio', data.bio);
  if (data.profileImage) formData.append('profileImage', data.profileImage);
  if (data.coverImage) formData.append('coverImage', data.coverImage);
  if (data.backgroundImage) formData.append('backgroundImage', data.backgroundImage);

  const response = await fetch(`${API_BASE_URL}/music/artists`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update artist profile');
  }

  return response.json();
}

/**
 * Get all playlists for the current user
 */
export async function getMyPlaylists(
  getToken: () => Promise<string | null>
): Promise<{ playlists: Playlist[] }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/playlists`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch playlists');
  }

  return response.json();
}

/**
 * Get a specific playlist with all songs
 */
export async function getPlaylist(playlistId: string): Promise<{ playlist: PlaylistWithSongs }> {
  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch playlist');
  }

  return response.json();
}

/**
 * Create a new playlist
 */
export async function createPlaylist(
  data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    coverImage?: File;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; playlist: Playlist }> {
  const token = await getToken();
  
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic ? '1' : '0');
  if (data.coverImage) formData.append('coverImage', data.coverImage);

  const response = await fetch(`${API_BASE_URL}/music/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create playlist');
  }

  return response.json();
}

/**
 * Update a playlist
 */
export async function updatePlaylist(
  playlistId: string,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    coverImage?: File;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; playlist: Playlist }> {
  const token = await getToken();
  
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.description) formData.append('description', data.description);
  if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic ? '1' : '0');
  if (data.coverImage) formData.append('coverImage', data.coverImage);

  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update playlist');
  }

  return response.json();
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(
  playlistId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete playlist');
  }

  return response.json();
}

/**
 * Add a song to a playlist
 */
export async function addSongToPlaylist(
  playlistId: string,
  songId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add song to playlist');
  }

  return response.json();
}

/**
 * Remove a song from a playlist
 */
export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove song from playlist');
  }

  return response.json();
}

/**
 * Report a song for moderation
 */
export async function reportSong(
  songId: string,
  data: {
    reportType: 'copyright' | 'explicit_content' | 'harassment' | 'spam' | 'other';
    description?: string;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; report: SongReport }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/report`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to report song');
  }

  return response.json();
}

/**
 * Get all pending song reports (admin only)
 */
export async function getPendingReports(
  getToken: () => Promise<string | null>
): Promise<{ reports: SongReport[] }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/reports`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch reports');
  }

  return response.json();
}

/**
 * Review/action a song report (admin only)
 */
export async function reviewReport(
  reportId: string,
  data: {
    action: 'dismiss' | 'delete_song' | 'ban_artist';
    adminNotes?: string;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/reports/${reportId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to review report');
  }

  return response.json();
}

/**
 * Delete any song (admin only)
 */
export async function adminDeleteSong(
  songId: string,
  reason: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/songs/${songId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete song');
  }

  return response.json();
}

/**
 * Ban an artist (admin only)
 */
export async function banArtist(
  artistId: string,
  data: {
    banType: 'temporary' | 'permanent';
    reason: string;
    banUntil?: string;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/artists/${artistId}/ban`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to ban artist');
  }

  return response.json();
}

/**
 * Unban an artist (admin only)
 */
export async function unbanArtist(
  artistId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/admin/artists/${artistId}/unban`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unban artist');
  }

  return response.json();
}

/**
 * Get recommended songs for the current user
 */
export async function getRecommendedSongs(
  getToken: () => Promise<string | null>
): Promise<{ songs: Song[] }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/recommendations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch recommendations');
  }

  return response.json();
}

// Enhanced song features interfaces
export interface Collaborator {
  id: string;
  song_id: string;
  collaborator_name: string;
  collaborator_role: string;
  collaborator_image_url?: string;
  added_by: string;
  created_at: string;
}

export interface SongStatistics {
  song_id: string;
  total_plays: number;
  total_likes: number;
  total_shares: number;
  total_saves: number;
  daily_stats: Array<{
    date: string;
    plays: number;
    likes: number;
    shares: number;
    saves: number;
  }>;
}

export interface ArtistStatistics {
  artist_id: string;
  total_songs: number;
  total_plays: number;
  total_likes: number;
  total_followers: number;
  monthly_stats: Array<{
    month: string;
    plays: number;
    likes: number;
    new_followers: number;
  }>;
}

export interface FollowStatus {
  is_following: boolean;
  follower_count: number;
}

/**
 * Update song metadata
 */
export async function updateSongMetadata(
  songId: string,
  data: {
    title?: string;
    story?: string;
    social_links?: {
      instagram?: string;
      twitter?: string;
      youtube?: string;
      website?: string;
    };
    copyright_info?: string;
    lyrics?: string;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/metadata`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update song metadata');
  }

  return response.json();
}

/**
 * Get song collaborators
 */
export async function getSongCollaborators(songId: string): Promise<{ collaborators: Collaborator[] }> {
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/collaborators`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch collaborators');
  }

  return response.json();
}

/**
 * Add a collaborator to a song
 */
export async function addSongCollaborator(
  songId: string,
  data: {
    collaborator_name: string;
    collaborator_role: string;
    collaborator_image_url?: string;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; collaborator: Collaborator }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/collaborators`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add collaborator');
  }

  return response.json();
}

/**
 * Remove a collaborator from a song
 */
export async function removeSongCollaborator(
  songId: string,
  collaboratorId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/collaborators/${collaboratorId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove collaborator');
  }

  return response.json();
}

/**
 * Follow an artist
 */
export async function followArtist(
  artistId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/artists/${artistId}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to follow artist');
  }

  return response.json();
}

/**
 * Unfollow an artist
 */
export async function unfollowArtist(
  artistId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/artists/${artistId}/follow`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unfollow artist');
  }

  return response.json();
}

/**
 * Check if user is following an artist
 */
export async function checkFollowStatus(
  artistId: string,
  getToken: () => Promise<string | null>
): Promise<FollowStatus> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/artists/${artistId}/follow/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check follow status');
  }

  return response.json();
}

/**
 * Get followed artists
 */
export async function getFollowedArtists(
  getToken: () => Promise<string | null>
): Promise<{ artists: Artist[] }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/artists/followed`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch followed artists');
  }

  return response.json();
}

/**
 * Get song statistics
 */
export async function getSongStatistics(songId: string): Promise<{ statistics: SongStatistics }> {
  const response = await fetch(`${API_BASE_URL}/music/songs/${songId}/statistics`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch song statistics');
  }

  return response.json();
}

/**
 * Get artist statistics
 */
export async function getArtistStatistics(artistId: string): Promise<{ statistics: ArtistStatistics }> {
  const response = await fetch(`${API_BASE_URL}/music/artists/${artistId}/statistics`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch artist statistics');
  }

  return response.json();
}

/**
 * Update artist profile
 */
export async function updateArtistProfile(
  data: {
    bio?: string;
    social_links?: {
      instagram?: string;
      twitter?: string;
      youtube?: string;
      website?: string;
    };
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/music/artists/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update artist profile');
  }

  return response.json();
}

/**
 * Create a new album
 */
export async function createAlbum(
  data: {
    title: string;
    description?: string;
    releaseDate?: string;
    coverImage?: File;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; album: Album }> {
  const token = await getToken();

  const formData = new FormData();
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.releaseDate) formData.append('releaseDate', data.releaseDate);
  if (data.coverImage) formData.append('coverImage', data.coverImage);

  const response = await fetch(`${API_BASE_URL}/music/albums`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create album');
  }

  return response.json();
}

/**
 * Get user's albums
 */
export async function getMyAlbums(
  getToken: () => Promise<string | null>
): Promise<{ albums: Album[] }> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/music/albums/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch albums');
  }

  return response.json();
}

/**
 * Get album by ID with songs
 */
export async function getAlbum(albumId: string): Promise<{ album: Album; songs: Song[] }> {
  const response = await fetch(`${API_BASE_URL}/music/albums/${albumId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch album');
  }

  return response.json();
}

/**
 * Update album
 */
export async function updateAlbum(
  albumId: string,
  data: {
    title?: string;
    description?: string;
    releaseDate?: string;
    coverImage?: File;
  },
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string; album: Album }> {
  const token = await getToken();

  const formData = new FormData();
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.releaseDate) formData.append('releaseDate', data.releaseDate);
  if (data.coverImage) formData.append('coverImage', data.coverImage);

  const response = await fetch(`${API_BASE_URL}/music/albums/${albumId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update album');
  }

  return response.json();
}

/**
 * Delete album
 */
export async function deleteAlbum(
  albumId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/music/albums/${albumId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete album');
  }

  return response.json();
}

/**
 * Add song to album
 */
export async function addSongToAlbum(
  albumId: string,
  songId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/music/albums/${albumId}/songs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ songId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add song to album');
  }

  return response.json();
}

/**
 * Remove song from album
 */
export async function removeSongFromAlbum(
  albumId: string,
  songId: string,
  getToken: () => Promise<string | null>
): Promise<{ success: boolean; message: string }> {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/music/albums/${albumId}/songs/${songId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove song from album');
  }

  return response.json();
}
