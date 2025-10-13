import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Folder,
  FileText,
  MoreHorizontal,
  Star,
  Clock,
  Download,
  Trash2,
  Share2,
  Edit,
  Copy,
  FolderOpen,
  ChevronRight,
  Grid3X3,
  List,
  StarOff,
  Image,
  Music,
  Video,
  Archive,
  Upload,
  File,
  Plus,
  FolderPlus,
  Search,
  Home,
  Filter,
  Eye,
  Settings,
  Grid
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DriveDocument, DriveFolder, getUserDocuments, getUserFolders } from '@/lib/driveApi';
import { fileApiClient } from '@/lib/fileApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';

interface FileBrowserProps {
  currentFolderId?: string;
  onFolderChange: (folderId: string | null) => void;
  onDocumentSelect: (document: DriveDocument) => void;
  onDocumentCreate: () => void;
  onFolderCreate: () => void;
  className?: string;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

type ViewMode = 'grid' | 'list';

export const FileBrowser: React.FC<FileBrowserProps> = ({
  currentFolderId,
  onFolderChange,
  onDocumentSelect,
  onDocumentCreate,
  onFolderCreate,
  className
}) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<DriveDocument[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Drive' }
  ]);

  // Load data when folder changes
  useEffect(() => {
    loadData();
  }, [currentFolderId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // For demo purposes, showing empty state with some sample items
      setDocuments([
        {
          id: '1',
          title: 'Getting Started.md',
          content: '# Welcome to Enzonic Drive',
          type: 'markdown',
          size: 1024,
          user_id: 'user1',
          folder_id: currentFolderId || null,
          is_favorite: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_modified_by: 'user1',
          is_encrypted: true
        },
        {
          id: '2',
          title: 'Project Plan.json',
          content: '{"name": "My Project"}',
          type: 'json',
          size: 256,
          user_id: 'user1',
          folder_id: currentFolderId || null,
          is_favorite: true,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_modified_by: 'user1',
          is_encrypted: true
        }
      ]);

      setFolders([
        {
          id: 'folder1',
          name: 'Documents',
          description: 'My documents folder',
          user_id: 'user1',
          parent_folder_id: currentFolderId || null,
          color: '#1976d2',
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'folder2',
          name: 'Projects',
          description: 'Project files',
          user_id: 'user1',
          parent_folder_id: currentFolderId || null,
          color: '#388e3c',
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load files and folders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return <FileText className="h-8 w-8 text-primary" />;
      case 'json':
        return <FileText className="h-8 w-8 text-orange-500" />;
      case 'document':
        return <FileText className="h-8 w-8 text-primary" />;
      case 'image':
        return <Image className="h-8 w-8 text-green-500" />;
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'audio':
        return <Music className="h-8 w-8 text-pink-500" />;
      case 'archive':
        return <Archive className="h-8 w-8 text-yellow-500" />;
      default:
        return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleItemSelect = (id: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set([id]));
    }
  };

  const toggleFavorite = async (documentId: string) => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        const updatedDoc = { ...doc, is_favorite: !doc.is_favorite };
        setDocuments(prev => prev.map(d => d.id === documentId ? updatedDoc : d));
        
        toast({
          title: updatedDoc.is_favorite ? "Added to favorites" : "Removed from favorites",
          description: `"${doc.title}" ${updatedDoc.is_favorite ? 'added to' : 'removed from'} favorites.`,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => 
        fileApiClient.uploadFile(file, currentFolderId || undefined)
      );
      
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(result => result.success);
      const failed = results.filter(result => !result.success);

      if (successful.length > 0) {
        toast({
          title: "Upload successful",
          description: `${successful.length} file(s) uploaded successfully.`,
        });
      }

      if (failed.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failed.length} file(s) failed to upload.`,
          variant: "destructive",
        });
      }
      
      // Reload data to show new files
      loadData();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={onDocumentCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
          <Button variant="outline" onClick={onFolderCreate} size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button variant="outline" size="sm" disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.id || 'root'}>
              <button
                onClick={() => onFolderChange(item.id)}
                className="hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </button>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-4 w-4" />
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Empty State */}
      {filteredFolders.length === 0 && filteredDocuments.length === 0 && !searchQuery && (
        <Card className="border-dashed">
          <CardContent className="text-center py-16">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No files or folders yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a new document, folder, or uploading files from your computer.
            </p>
            <div className="flex justify-center space-x-2">
              <Button onClick={onDocumentCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
              <Button variant="outline" onClick={onFolderCreate}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {filteredFolders.length === 0 && filteredDocuments.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-16">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No results found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or browse your files.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (filteredFolders.length > 0 || filteredDocuments.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Folders */}
          {filteredFolders.map((folder) => (
            <Card
              key={folder.id}
              className={cn(
                "cursor-pointer hover:shadow-lg transition-all duration-200 border-2 group",
                selectedItems.has(folder.id) 
                  ? "border-primary shadow-md" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  handleItemSelect(folder.id, true);
                } else {
                  onFolderChange(folder.id);
                }
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-3">
                  <Folder 
                    className="h-12 w-12 mx-auto text-primary group-hover:scale-110 transition-transform"
                  />
                </div>
                <h4 className="font-medium text-sm truncate mb-2" title={folder.name}>
                  {folder.name}
                </h4>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{formatDate(folder.updated_at)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Documents */}
          {filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className={cn(
                "cursor-pointer hover:shadow-lg transition-all duration-200 border-2 group",
                selectedItems.has(document.id) 
                  ? "border-primary shadow-md" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  handleItemSelect(document.id, true);
                } else {
                  onDocumentSelect(document);
                }
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-3">
                  <div className="group-hover:scale-110 transition-transform">
                    {getFileIcon(document.type)}
                  </div>
                </div>
                <h4 className="font-medium text-sm truncate mb-2" title={document.title}>
                  {document.title}
                </h4>
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                  <span>{formatFileSize(document.size)}</span>
                  <div className="flex items-center space-x-1">
                    {document.is_favorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDocumentSelect(document)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFavorite(document.id)}>
                          {document.is_favorite ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from favorites
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Add to favorites
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(document.updated_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (filteredFolders.length > 0 || filteredDocuments.length > 0) && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {/* Folders */}
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={cn(
                    "flex items-center space-x-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors group",
                    selectedItems.has(folder.id) && "bg-primary/5"
                  )}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      handleItemSelect(folder.id, true);
                    } else {
                      onFolderChange(folder.id);
                    }
                  }}
                >
                  <Folder className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {folder.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {folder.description || 'Folder'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <span className="hidden sm:block">{formatDate(folder.updated_at)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* Documents */}
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className={cn(
                    "flex items-center space-x-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors group",
                    selectedItems.has(document.id) && "bg-primary/5"
                  )}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      handleItemSelect(document.id, true);
                    } else {
                      onDocumentSelect(document);
                    }
                  }}
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(document.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium truncate">
                        {document.title}
                      </p>
                      {document.is_favorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(document.size)} • {document.type.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <span className="hidden sm:block">{formatDate(document.updated_at)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDocumentSelect(document)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFavorite(document.id)}>
                          {document.is_favorite ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from favorites
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Add to favorites
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileBrowser;