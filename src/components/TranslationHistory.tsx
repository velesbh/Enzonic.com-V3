import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { History, ArrowRight, Copy, Check, FileText, Languages as LanguagesIcon } from "lucide-react";
import { TranslationHistoryItem, getTextTranslationHistory, getFileTranslationHistory } from "@/lib/translationApi";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

interface TranslationHistoryProps {
  onSelectTranslation: (sourceText: string, translatedText: string, sourceLang: string, targetLang: string) => void;
}

const TranslationHistory = ({ onSelectTranslation }: TranslationHistoryProps) => {
  const [textHistory, setTextHistory] = useState<TranslationHistoryItem[]>([]);
  const [fileHistory, setFileHistory] = useState<TranslationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const { getToken } = useAuth();
  const { toast } = useToast();

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" }
  ];

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [textData, fileData] = await Promise.all([
        getTextTranslationHistory(getToken),
        getFileTranslationHistory(getToken)
      ]);
      setTextHistory(textData);
      setFileHistory(fileData);
    } catch (error) {
      console.error('Failed to fetch translation history:', error);
      toast({
        title: "Error",
        description: "Failed to load translation history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied",
        description: "Text copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive"
      });
    }
  };

  const handleSelectTranslation = (item: TranslationHistoryItem) => {
    onSelectTranslation(item.sourceText, item.translatedText, item.sourceLang, item.targetLang);
    toast({
      title: "Translation Loaded",
      description: "Previous translation has been loaded into the translator"
    });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Translation History
          </CardTitle>
          <CardDescription>Your recent translations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderHistoryItems = (history: TranslationHistoryItem[], isFileType: boolean = false) => {
    if (history.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {isFileType ? 'file' : 'text'} translation history yet</p>
          <p className="text-sm">Your {isFileType ? 'file' : 'text'} translations will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => handleSelectTranslation(item)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {isFileType && item.fileName && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {item.fileName}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {getLanguageName(item.sourceLang)}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {getLanguageName(item.targetLang)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item.translatedText, item.id);
                }}
              >
                {copiedId === item.id ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Original: </span>
                <span className="text-muted-foreground">
                  {item.sourceText.length > 100 
                    ? `${item.sourceText.substring(0, 100)}...` 
                    : item.sourceText}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Translation: </span>
                <span>
                  {item.translatedText.length > 100 
                    ? `${item.translatedText.substring(0, 100)}...` 
                    : item.translatedText}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchHistory}
          className="w-full"
        >
          Refresh History
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Translation History
        </CardTitle>
        <CardDescription>View your text and file translation history</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'file')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <LanguagesIcon className="h-4 w-4" />
              Text ({textHistory.length})
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files ({fileHistory.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text">
            {renderHistoryItems(textHistory, false)}
          </TabsContent>
          
          <TabsContent value="file">
            {renderHistoryItems(fileHistory, true)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TranslationHistory;