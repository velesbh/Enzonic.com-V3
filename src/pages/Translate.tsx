import { useState, useEffect } from "react";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import TranslationHistory from "@/components/TranslationHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeftRight, Languages, Check, ChevronsUpDown, UserPlus, Upload, FileText, Download, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { saveTranslationToHistory } from "@/lib/translationApi";
import { useServiceStatus, recordActivity } from "@/lib/serviceApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";
import { LoadingButton } from "@/components/ui/loading-button";

const Translate = () => {
  usePageMetadata();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // Key to force history refresh
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [translatedFileContent, setTranslatedFileContent] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  
  const { toast } = useToast();
  const { getToken, isSignedIn } = useAuth();
  
  // Check service availability
  const { status: serviceStatus, loading: serviceLoading } = useServiceStatus('translate');

  // Record page view activity
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const token = isSignedIn ? await getToken() : undefined;
        await recordActivity('page_view', {
          page: 'translate',
          url: window.location.href
        }, token);
      } catch (error) {
        // Silently fail for analytics
        console.debug('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [isSignedIn, getToken]);

  // If service is not available, show unavailable page
  if (!serviceLoading && serviceStatus && !serviceStatus.available) {
    return (
      <ServiceUnavailable 
        serviceName="AI Translate" 
        description="The translation service is currently disabled by the administrator."
        icon={<Languages className="h-8 w-8 text-orange-600 dark:text-orange-400" />}
      />
    );
  }

  // Show loading while checking service status
  if (serviceLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <EnzonicLoading size="lg" message="Checking service availability..." variant="orbit" />
        </main>
        <Footer />
      </div>
    );
  }
  const languages = [{
    code: "en",
    name: "English"
  }, {
    code: "es",
    name: "Spanish"
  }, {
    code: "fr",
    name: "French"
  }, {
    code: "de",
    name: "German"
  }, {
    code: "it",
    name: "Italian"
  }, {
    code: "pt",
    name: "Portuguese"
  }, {
    code: "ru",
    name: "Russian"
  }, {
    code: "ja",
    name: "Japanese"
  }, {
    code: "ko",
    name: "Korean"
  }, {
    code: "zh",
    name: "Chinese"
  }, {
    code: "ar",
    name: "Arabic"
  }, {
    code: "hi",
    name: "Hindi"
  }];
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['text/plain', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or TXT file",
        variant: "destructive"
      });
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      let text = "";
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Read TXT file
        text = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDF, we'll need to use a library like pdf.js or send to backend
        // For now, show a message that PDF processing is in progress
        toast({
          title: "PDF Processing",
          description: "Reading PDF content...",
        });
        
        // Read PDF as text (basic approach - in production use pdf.js)
        const formData = new FormData();
        formData.append('file', file);
        
        // We'll implement a simple text extraction
        // In a real app, you'd want to use pdf.js or a backend service
        text = await extractPDFText(file);
      }

      setFileContent(text);
      setTranslatedFileContent("");
      
      toast({
        title: "File Loaded",
        description: `Successfully loaded ${file.name}`,
      });
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "File Processing Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Simple PDF text extraction (fallback method)
  const extractPDFText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const text = new TextDecoder().decode(arrayBuffer);
          
          // Basic PDF text extraction (removes binary data)
          const matches = text.match(/\(([^)]+)\)/g);
          if (matches) {
            const extractedText = matches
              .map(match => match.slice(1, -1))
              .join(' ')
              .replace(/\\[nrt]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (extractedText.length > 50) {
              resolve(extractedText);
            } else {
              reject(new Error("Could not extract readable text from PDF. Please try a text-based PDF or TXT file."));
            }
          } else {
            reject(new Error("Could not extract text from PDF. Please try a different file."));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file translation
  const handleFileTranslate = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Error",
        description: "No content to translate",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);

    try {
      const token = isSignedIn ? await getToken() : undefined;
      await recordActivity('file_translation_attempt', {
        sourceLang,
        targetLang,
        fileType: uploadedFile?.type,
        fileSize: uploadedFile?.size,
        textLength: fileContent.length
      }, token);

      // Split content into chunks if too large (max 4000 chars per chunk)
      const chunkSize = 4000;
      const chunks: string[] = [];
      
      for (let i = 0; i < fileContent.length; i += chunkSize) {
        chunks.push(fileContent.slice(i, i + chunkSize));
      }

      let translatedChunks: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const response = await fetch(env.OPENAI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "translate",
            messages: [{
              role: "system",
              content: "You are a professional translator. Translate text accurately while preserving meaning, formatting, and tone. Only provide the translation without explanations."
            }, {
              role: "user",
              content: `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${chunks[i]}`
            }],
            max_tokens: 5000,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          throw new Error(`Translation failed for chunk ${i + 1}`);
        }

        const data = await response.json();
        const translation = data.choices?.[0]?.message?.content?.trim() || "";
        translatedChunks.push(translation);

        // Show progress
        toast({
          title: "Translating...",
          description: `Processed ${i + 1} of ${chunks.length} chunks`,
        });
      }

      const fullTranslation = translatedChunks.join('\n\n');
      setTranslatedFileContent(fullTranslation);

      // Save to history if user is signed in
      if (isSignedIn) {
        try {
          await saveTranslationToHistory({
            sourceText: fileContent,
            translatedText: fullTranslation,
            sourceLang,
            targetLang,
            type: 'file',
            fileName: uploadedFile?.name
          }, getToken);
          setHistoryKey(prev => prev + 1); // Trigger history refresh
        } catch (error) {
          console.error('Failed to save file translation to history:', error);
          // Don't show error to user for history save failure
        }
      }

      await recordActivity('file_translation_success', {
        sourceLang,
        targetLang,
        chunksProcessed: chunks.length
      }, token);

      toast({
        title: "Success",
        description: "File translation completed successfully",
      });
    } catch (error) {
      console.error("File translation error:", error);
      toast({
        title: "Translation Error",
        description: error instanceof Error ? error.message : "Failed to translate file",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // Download translated file
  const handleDownloadTranslation = () => {
    if (!translatedFileContent) return;

    const blob = new Blob([translatedFileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${uploadedFile?.name || 'document.txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Translation downloaded successfully",
    });
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileContent("");
    setTranslatedFileContent("");
  };
  
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to translate",
        variant: "destructive"
      });
      return;
    }
    
    setIsTranslating(true);
    
    // Record translation attempt activity
    try {
      const token = isSignedIn ? await getToken() : undefined;
      await recordActivity('translation_attempt', {
        sourceLang,
        targetLang,
        textLength: sourceText.length
      }, token);
    } catch (error) {
      // Silently fail for analytics
      console.debug('Failed to track translation attempt:', error);
    }
    
    try {
      // Try chat completions endpoint (OpenAI-compatible)
      const response = await fetch(env.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "translate",
          messages: [{
            role: "system",
            content: "You are a professional translator. Translate text accurately while preserving meaning and tone. Only provide the translation without explanations."
          }, {
            role: "user",
            content: `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${sourceText}`
          }],
          max_tokens: 2000,
          temperature: 0.3
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Translation failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      // Try both chat completion and regular completion response formats
      const translation = data.choices?.[0]?.message?.content?.trim() ||
      // chat completion format
      data.choices?.[0]?.text?.trim() ||
      // regular completion format
      data.text?.trim() ||
      // direct text format
      "";
      
      if (!translation) {
        console.error("No translation in response:", data);
        throw new Error("No translation received from API");
      }
      
      setTranslatedText(translation);
      
      // Save to history if user is signed in
      if (isSignedIn) {
        try {
          await saveTranslationToHistory({
            sourceText,
            translatedText: translation,
            sourceLang,
            targetLang,
            type: 'text'
          }, getToken);
          setHistoryKey(prev => prev + 1); // Trigger history refresh
        } catch (error) {
          console.error('Failed to save translation to history:', error);
          // Don't show error to user for history save failure
        }
      }
      
      // Record successful translation
      try {
        const token = isSignedIn ? await getToken() : undefined;
        await recordActivity('translation_success', {
          sourceLang,
          targetLang,
          sourceLength: sourceText.length,
          translationLength: translation.length
        }, token);
      } catch (error) {
        // Silently fail for analytics
        console.debug('Failed to track translation success:', error);
      }
      
      toast({
        title: "Success",
        description: "Translation completed successfully"
      });
    } catch (error) {
      console.error("Translation error:", error);
      
      // Record translation error
      try {
        const token = isSignedIn ? await getToken() : undefined;
        await recordActivity('translation_error', {
          sourceLang,
          targetLang,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, token);
      } catch (trackingError) {
        // Silently fail for analytics
        console.debug('Failed to track translation error:', trackingError);
      }
      
      toast({
        title: "Translation Error",
        description: error instanceof Error ? error.message : "Failed to translate text",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };
  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleSelectTranslation = (sourceText: string, translatedText: string, sourceLang: string, targetLang: string) => {
    setSourceText(sourceText);
    setTranslatedText(translatedText);
    setSourceLang(sourceLang);
    setTargetLang(targetLang);
  };
  return <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full">
        <section className="py-8 sm:py-12 md:py-16 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center space-y-4 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <Languages className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Enzonic Translate</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Break language barriers with our advanced AI translation service
                </p>
              </div>

            {/* Translation Card */}
            <Card className="animate-fade-in [animation-delay:100ms] shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">AI Translation</CardTitle>
                <CardDescription className="text-base">
                  Translate text or upload PDF/TXT files for instant translation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Text Translation
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      File Translation
                    </TabsTrigger>
                  </TabsList>

                  {/* Text Translation Tab */}
                  <TabsContent value="text" className="space-y-6 mt-6">
                    {/* Language Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={sourceOpen}
                            className="w-full justify-between rounded-full"
                            disabled={isTranslating}
                          >
                            {languages.find((lang) => lang.code === sourceLang)?.name || "Select language..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search language..." />
                            <CommandList>
                              <CommandEmpty>No language found.</CommandEmpty>
                              <CommandGroup>
                                {languages.map((lang) => (
                                  <CommandItem
                                    key={lang.code}
                                    value={lang.name}
                                    onSelect={() => {
                                      setSourceLang(lang.code);
                                      setSourceOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        sourceLang === lang.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {lang.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="flex justify-center">
                        <Button variant="ghost" size="icon" onClick={swapLanguages} className="rounded-full" disabled={isTranslating}>
                          <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <Popover open={targetOpen} onOpenChange={setTargetOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={targetOpen}
                            className="w-full justify-between rounded-full"
                            disabled={isTranslating}
                          >
                            {languages.find((lang) => lang.code === targetLang)?.name || "Select language..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search language..." />
                            <CommandList>
                              <CommandEmpty>No language found.</CommandEmpty>
                              <CommandGroup>
                                {languages.map((lang) => (
                                  <CommandItem
                                    key={lang.code}
                                    value={lang.name}
                                    onSelect={() => {
                                      setTargetLang(lang.code);
                                      setTargetOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        targetLang === lang.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {lang.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Text Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Source Text</label>
                        <Textarea 
                          placeholder="Enter text to translate..." 
                          value={sourceText} 
                          onChange={e => setSourceText(e.target.value)} 
                          className="min-h-[240px] resize-none rounded-2xl border-2 focus:border-primary" 
                          disabled={isTranslating} 
                        />
                        <p className="text-xs text-muted-foreground">
                          {sourceText.length} characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Translation</label>
                        <Textarea 
                          placeholder="Translation will appear here..." 
                          value={translatedText} 
                          readOnly 
                          className="min-h-[240px] resize-none rounded-2xl border-2 bg-muted/30" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {translatedText.length} characters
                        </p>
                      </div>
                    </div>

                    {/* Translate Button */}
                    <LoadingButton 
                      onClick={handleTranslate} 
                      loading={isTranslating}
                      loadingText="Translating..."
                      loadingVariant="wave"
                      disabled={!sourceText.trim()} 
                      className="w-full rounded-full" 
                      size="lg"
                      icon={<Languages className="h-4 w-4" />}
                    >
                      Translate
                    </LoadingButton>
                  </TabsContent>

                  {/* File Translation Tab */}
                  <TabsContent value="file" className="space-y-6 mt-6">
                    {/* Language Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={sourceOpen}
                            className="w-full justify-between rounded-full"
                            disabled={isTranslating}
                          >
                            {languages.find((lang) => lang.code === sourceLang)?.name || "Select language..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search language..." />
                            <CommandList>
                              <CommandEmpty>No language found.</CommandEmpty>
                              <CommandGroup>
                                {languages.map((lang) => (
                                  <CommandItem
                                    key={lang.code}
                                    value={lang.name}
                                    onSelect={() => {
                                      setSourceLang(lang.code);
                                      setSourceOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        sourceLang === lang.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {lang.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="flex justify-center">
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <Popover open={targetOpen} onOpenChange={setTargetOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={targetOpen}
                            className="w-full justify-between rounded-full"
                            disabled={isTranslating}
                          >
                            {languages.find((lang) => lang.code === targetLang)?.name || "Select language..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search language..." />
                            <CommandList>
                              <CommandEmpty>No language found.</CommandEmpty>
                              <CommandGroup>
                                {languages.map((lang) => (
                                  <CommandItem
                                    key={lang.code}
                                    value={lang.name}
                                    onSelect={() => {
                                      setTargetLang(lang.code);
                                      setTargetOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        targetLang === lang.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {lang.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* File Upload Area */}
                    {!uploadedFile ? (
                      <div className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.txt,text/plain,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          disabled={isTranslating || isProcessingFile}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                          <h3 className="text-lg font-semibold mb-2">Upload PDF or TXT File</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Drag and drop or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Maximum file size: 10MB • Supported formats: PDF, TXT
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Uploaded File Info */}
                        <Card className="border-2 border-primary/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{uploadedFile.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(uploadedFile.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRemoveFile}
                                disabled={isTranslating}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* File Content Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Original Content</label>
                            <Textarea 
                              value={fileContent}
                              readOnly
                              className="min-h-[300px] resize-none rounded-2xl border-2 bg-muted/30 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              {fileContent.length} characters
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Translated Content</label>
                            <Textarea 
                              value={translatedFileContent}
                              readOnly
                              className="min-h-[300px] resize-none rounded-2xl border-2 bg-muted/30 text-sm"
                              placeholder="Translation will appear here..."
                            />
                            <p className="text-xs text-muted-foreground">
                              {translatedFileContent.length} characters
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <LoadingButton 
                            onClick={handleFileTranslate} 
                            loading={isTranslating}
                            loadingText="Translating..."
                            loadingVariant="wave"
                            disabled={!fileContent.trim()} 
                            className="flex-1 rounded-full" 
                            size="lg"
                            icon={<Languages className="h-4 w-4" />}
                          >
                            Translate File
                          </LoadingButton>
                          
                          {translatedFileContent && (
                            <>
                              <Button
                                onClick={handleDownloadTranslation}
                                variant="outline"
                                size="lg"
                                className="rounded-full"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

              {/* Features */}
              
              {/* Translation History for Signed In Users */}
              <SignedIn>
                <div className="animate-fade-in [animation-delay:200ms]">
                  <TranslationHistory 
                    key={historyKey}
                    onSelectTranslation={handleSelectTranslation} 
                  />
                </div>
              </SignedIn>

              {/* Sign In Prompt for Guests */}
              <SignedOut>
                <Card className="animate-fade-in [animation-delay:200ms] border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Save Your Translation History</h3>
                        <p className="text-muted-foreground">
                          Sign in to automatically save your last 5 translations for easy access
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SignedOut>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default Translate;