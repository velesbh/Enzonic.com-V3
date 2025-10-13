import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Share2, 
  Eye, 
  Edit3, 
  Settings, 
  Clock,
  FileText,
  Code,
  Globe,
  Lock,
  Loader2
} from 'lucide-react';
import { DriveDocument, updateDocument, AutoSave } from '@/lib/driveApi';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@clerk/clerk-react';

interface DocumentEditorProps {
  document: DriveDocument;
  onDocumentUpdate: (document: Partial<DriveDocument>) => void;
  readOnly?: boolean;
  className?: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onDocumentUpdate,
  readOnly = false,
  className = ''
}) => {
  const [content, setContent] = useState(document.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const { toast } = useToast();
  const { getToken } = useAuth();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveRef = useRef<AutoSave | null>(null);

  useEffect(() => {
    setContent(document.content || '');
  }, [document.content]);

  useEffect(() => {
    if (autoSaveEnabled && !readOnly && document.id) {
      const token = getToken?.();
      autoSaveRef.current = new AutoSave(document.id, token);
      autoSaveRef.current.start(() => content);

      return () => {
        autoSaveRef.current?.stop();
      };
    }
  }, [document.id, autoSaveEnabled, readOnly, getToken]);

  const handleSave = async () => {
    if (readOnly || !document.id) return;

    setIsSaving(true);
    try {
      const token = await getToken?.();
      const result = await updateDocument(
        document.id,
        { content },
        token
      );

      onDocumentUpdate(result.document);
      setLastSaved(new Date());
      
      toast({
        title: 'Document saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save document',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEditorLanguage = () => {
    switch (document.type) {
      case 'javascript':
        return 'javascript';
      case 'typescript':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'python':
        return 'python';
      case 'json':
        return 'json';
      case 'markdown':
        return 'markdown';
      default:
        return 'text';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {document.type === 'markdown' && <FileText className="h-4 w-4 text-blue-600" />}
              {document.type === 'javascript' && <Code className="h-4 w-4 text-yellow-600" />}
              {document.type === 'typescript' && <Code className="h-4 w-4 text-blue-700" />}
              {document.type === 'json' && <FileText className="h-4 w-4 text-green-600" />}
              {document.type === 'html' && <Globe className="h-4 w-4 text-orange-600" />}
              {document.type === 'css' && <FileText className="h-4 w-4 text-purple-600" />}
              {document.type === 'python' && <Code className="h-4 w-4 text-green-700" />}
              {!['markdown', 'javascript', 'typescript', 'json', 'html', 'css', 'python'].includes(document.type) && 
               <FileText className="h-4 w-4 text-gray-600" />}
              <CardTitle className="text-lg">{document.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {document.isPublic ? (
                <Badge variant="secondary" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                v{document.version}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            
            {!readOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Implement share */}}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{formatFileSize(document.contentSize)}</span>
            <span>{getEditorLanguage()}</span>
            {document.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {!readOnly && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="h-3 w-3"
                />
                Auto-save
              </label>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {isEditing || readOnly ? (
          <div className="h-full">
            {document.type === 'markdown' && !isEditing ? (
              <div className="p-4 h-full overflow-auto prose prose-sm max-w-none">
                {/* TODO: Render markdown */}
                <pre className="whitespace-pre-wrap">{content}</pre>
              </div>
            ) : (
              <Textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Start writing your ${document.type} content...`}
                className="h-full resize-none border-0 rounded-none font-mono text-sm"
                readOnly={readOnly}
                style={{
                  minHeight: 'calc(100vh - 200px)'
                }}
              />
            )}
          </div>
        ) : (
          <div className="p-4 h-full overflow-auto">
            {document.type === 'markdown' ? (
              <div className="prose prose-sm max-w-none">
                {/* TODO: Render markdown */}
                <pre className="whitespace-pre-wrap">{content}</pre>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm">{content}</pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentEditor;