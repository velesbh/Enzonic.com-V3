import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Music, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createAlbum,
  getMyAlbums,
  updateAlbum,
  deleteAlbum,
  type Album
} from '@/lib/musicApi';

interface Album {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  release_date?: string;
  song_count: number;
  total_duration: number;
  created_at: string;
}

interface AlbumManagementProps {
  artistId: string;
}

export function AlbumManagement({ artistId }: AlbumManagementProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    releaseDate: '',
    coverImage: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const response = await getMyAlbums(() => Promise.resolve(localStorage.getItem('token')));
      setAlbums(response.albums || []);
    } catch (error) {
      console.error('Error loading albums:', error);
      toast({
        title: 'Error',
        description: 'Failed to load albums',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      releaseDate: '',
      coverImage: null
    });
    setEditingAlbum(null);
  };

  const handleCreateAlbum = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Album title is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const albumData = new FormData();
      albumData.append('title', formData.title);
      if (formData.description) albumData.append('description', formData.description);
      if (formData.releaseDate) albumData.append('releaseDate', formData.releaseDate);
      if (formData.coverImage) albumData.append('coverImage', formData.coverImage);

      await createAlbum({
        title: formData.title,
        description: formData.description,
        releaseDate: formData.releaseDate,
        coverImage: formData.coverImage
      }, () => Promise.resolve(localStorage.getItem('token')));
      toast({
        title: 'Success',
        description: 'Album created successfully'
      });
      setCreateDialogOpen(false);
      resetForm();
      loadAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
      toast({
        title: 'Error',
        description: 'Failed to create album',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateAlbum = async () => {
    if (!editingAlbum || !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Album title is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const albumData = new FormData();
      albumData.append('title', formData.title);
      if (formData.description) albumData.append('description', formData.description);
      if (formData.releaseDate) albumData.append('releaseDate', formData.releaseDate);
      if (formData.coverImage) albumData.append('coverImage', formData.coverImage);

      await updateAlbum(editingAlbum.id, {
        title: formData.title,
        description: formData.description,
        releaseDate: formData.releaseDate,
        coverImage: formData.coverImage
      }, () => Promise.resolve(localStorage.getItem('token')));
      toast({
        title: 'Success',
        description: 'Album updated successfully'
      });
      setEditingAlbum(null);
      resetForm();
      loadAlbums();
    } catch (error) {
      console.error('Error updating album:', error);
      toast({
        title: 'Error',
        description: 'Failed to update album',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAlbum(albumId, () => Promise.resolve(localStorage.getItem('token')));
      toast({
        title: 'Success',
        description: 'Album deleted successfully'
      });
      loadAlbums();
    } catch (error) {
      console.error('Error deleting album:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete album',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      description: album.description || '',
      releaseDate: album.release_date ? album.release_date.split('T')[0] : '',
      coverImage: null
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Albums</CardTitle>
          <CardDescription>Manage your music albums</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Album Management</CardTitle>
            <CardDescription>Organize your music into albums and collections</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Album
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Album</DialogTitle>
                <DialogDescription>
                  Add a new album to your collection
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Album title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Album description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Release Date</label>
                  <Input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cover Image</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAlbum}>
                    Create Album
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {albums.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No albums yet</p>
            <p className="text-sm text-muted-foreground">Create your first album to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {albums.map((album) => (
                <div key={album.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Music className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{album.title}</h3>
                    {album.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {album.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Music className="w-4 h-4" />
                        <span>{album.song_count} songs</span>
                      </div>
                      {album.total_duration > 0 && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(album.total_duration)}</span>
                        </div>
                      )}
                      {album.release_date && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(album.release_date).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(album)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAlbum(album.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Edit Album Dialog */}
      <Dialog open={!!editingAlbum} onOpenChange={(open) => !open && setEditingAlbum(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
            <DialogDescription>
              Update album information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Album title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Album description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Release Date</label>
              <Input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cover Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep current image
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingAlbum(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAlbum}>
                Update Album
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}