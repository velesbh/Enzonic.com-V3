import { useState, useEffect } from "react";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import TranslationHistory from "@/components/TranslationHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftRight, Languages, Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { saveTranslationToHistory } from "@/lib/translationApi";
import { useServiceStatus, recordActivity } from "@/lib/serviceApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";

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
          <EnzonicLoading size="lg" message="Checking service availability..." />
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
            targetLang
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
                <CardTitle className="text-2xl">Translate Text</CardTitle>
                <CardDescription className="text-base">
                  Select your source and target languages, then enter your text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                <Button onClick={handleTranslate} disabled={isTranslating || !sourceText.trim()} className="w-full rounded-full" size="lg">
                  {isTranslating ? (
                    <EnzonicLoading size="sm" variant="minimal" message="Translating..." showLogo={false} />
                  ) : (
                    <>
                      <Languages className="mr-2 h-4 w-4" />
                      Translate
                    </>
                  )}
                </Button>
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