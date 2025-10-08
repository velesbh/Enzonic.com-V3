import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Bot, User, UserPlus, ChevronsUpDown, Check, ArrowUp, Plus, Grid3x3, Moon, Sun, Menu, Trash2, Copy, ThumbsUp, ThumbsDown, AlertCircle, ChevronLeft, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { saveChatMessage, getChatHistory, saveChatSession, getChatSessions, ChatMessage, ChatSession } from "@/lib/chatbotApi";
import { sendChatCompletion, parseStreamingResponse, AI_MODELS } from "@/lib/aiApi";
import { useServiceStatus, recordActivity } from "@/lib/serviceApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";
import { useTheme } from "@/components/ThemeProvider";
import AppGrid from "@/components/AppGrid";

const Chatbot = () => {
  usePageMetadata();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("cubic");
  const [modelOpen, setModelOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { getToken, isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Check service availability
  const { status: serviceStatus, loading: serviceLoading } = useServiceStatus('chatbot');

  // Available models
  const models = Object.values(AI_MODELS);

  // Record page view activity
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const token = isSignedIn ? await getToken() : undefined;
        await recordActivity('page_view', {
          page: 'chatbot',
          url: window.location.href
        }, token);
      } catch (error) {
        console.debug('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [isSignedIn, getToken]);

  // Load chat sessions when user is signed in
  useEffect(() => {
    const loadSessions = async () => {
      if (isSignedIn) {
        try {
          const sessions = await getChatSessions(getToken);
          setChatSessions(sessions);
          
          // If we have sessions and no current session, switch to the most recent one
          if (sessions.length > 0 && !currentSessionId) {
            const mostRecent = sessions[0];
            setCurrentSessionId(mostRecent.id);
            setChatHistory(mostRecent.messages);
          }
        } catch (error) {
          console.error('Failed to load chat sessions:', error);
        }
      }
    };

    loadSessions();
  }, [isSignedIn, getToken, currentSessionId]);

  // Auto-focus input on desktop when user starts typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're on desktop (not mobile) and not already focused on an input
      const isMobile = window.innerWidth < 768;
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      if (!isMobile && !isTyping && textareaRef.current && e.key.length === 1) {
        textareaRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingMessage]);

  // Format markdown-like text to HTML
  const formatMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/```([\\s\\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .replace(/\\n/g, '<br>');
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        description: "Failed to copy",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for AI API
      const messagesForApi = [...chatHistory, userMessage];
      
      // Send to AI API with streaming
      const stream = await sendChatCompletion(messagesForApi, selectedModel, true) as ReadableStream;
      
      setIsLoading(false);
      setIsStreaming(true);
      
      let fullResponse = '';
      
      // Process streaming response
      for await (const chunk of parseStreamingResponse(stream)) {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      }

      // Add complete message to history
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        model: selectedModel
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setStreamingMessage('');
      setIsStreaming(false);

      // Save to backend if user is signed in
      if (isSignedIn) {
        try {
          await saveChatMessage({
            userMessage: userMessage.content,
            assistantMessage: assistantMessage.content,
            model: selectedModel
          }, getToken);
        } catch (error) {
          console.error('Failed to save chat message:', error);
        }
      }

    } catch (error) {
      console.error('AI API Error:', error);
      setError("Failed to get response from AI. Please try again.");
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setCurrentSessionId(null);
    setError(null);
  };

  const createNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setChatHistory([]);
    setError(null);
  };

  const switchToSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setChatHistory(session.messages);
    setError(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Show loading screen while checking service status
  if (serviceLoading) {
    return <EnzonicLoading />;
  }

  // Only show service unavailable if explicitly disabled (default to available)
  if (serviceStatus?.available === false) {
    return <ServiceUnavailable service="Chatbot" />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SignedIn>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className={cn(
            "flex-shrink-0 border-r border-border bg-card transition-all duration-300",
            sidebarOpen ? "w-80" : "w-0 overflow-hidden"
          )}>
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Chat History</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={createNewSession}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Chat Sessions List */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {chatSessions.map((session) => (
                    <Button
                      key={session.id}
                      variant={currentSessionId === session.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => switchToSession(session)}
                    >
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="font-medium truncate w-full">
                          {session.name || 'Untitled Chat'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="max-w-4xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* Left side - Sidebar toggle and Model selector */}
                  <div className="flex items-center gap-3">
                    {!sidebarOpen && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="h-10 w-10"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    
                    <Popover open={modelOpen} onOpenChange={setModelOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-full border-2 hover:bg-primary/10"
                          disabled={isLoading || isStreaming}
                        >
                          {models.find((model) => model.id === selectedModel)?.name}
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search model..." />
                          <CommandList>
                            <CommandEmpty>No model found.</CommandEmpty>
                            <CommandGroup>
                              {models.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.id}
                                  onSelect={(currentValue) => {
                                    setSelectedModel(currentValue);
                                    setModelOpen(false);
                                  }}
                                  className="flex items-center gap-3 p-3"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedModel === model.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">
                                      {model.name.substring(0, 2)}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-sm text-muted-foreground">{model.description}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Right side - Theme toggle, Apps, User */}
                  <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="h-10 w-10 rounded-full hover:bg-primary/10"
                    >
                      {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )}
                    </Button>

                    {/* Apps Grid */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all h-10 w-10">
                          <Grid3x3 className="h-5 w-5" />
                          <span className="sr-only">Apps menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-0 border-2 w-96">
                        <AppGrid />
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Button */}
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all"
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {chatHistory.length === 0 && !isStreaming && !isLoading ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 animate-fade-in shadow-lg">
                      <MessageCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3 animate-fade-in [animation-delay:100ms]">
                      How can I help you today?
                    </h2>
                    <p className="text-muted-foreground text-lg animate-fade-in [animation-delay:200ms] max-w-md">
                      Start a conversation with {models.find(m => m.id === selectedModel)?.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto px-4 py-8">
                  <div className="space-y-6">
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 group">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                          {msg.role === 'user' ? (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Yo</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {(msg.model ? models.find(m => m.id === msg.model)?.name : 'Assistant').substring(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {msg.role === 'user' ? 'Yo' : (msg.model ? models.find(m => m.id === msg.model)?.name : 'Assistant')}
                            </span>
                          </div>
                          <div className="text-foreground leading-relaxed">
                            {msg.role === 'assistant' ? (
                              <div 
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            
                            {/* Action buttons for assistant messages */}
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(msg.content)}
                                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Streaming Message */}
                    {isStreaming && streamingMessage && (
                      <div className="flex items-start gap-3 group">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {models.find(m => m.id === selectedModel)?.name.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {models.find(m => m.id === selectedModel)?.name}
                            </span>
                          </div>
                          <div 
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: formatMarkdown(streamingMessage) }}
                          />
                          <div className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-1"></div>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {isLoading && !isStreaming && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {models.find(m => m.id === selectedModel)?.name.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {models.find(m => m.id === selectedModel)?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-75"></div>
                              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-150"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {error && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">Error</span>
                          </div>
                          <div className="text-destructive text-sm">
                            {error}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="mt-2 h-7 px-2 text-xs hover:bg-muted/50"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="max-w-4xl mx-auto p-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] max-h-[200px] resize-none rounded-2xl border-2 bg-background pr-14 text-base leading-relaxed focus:border-primary shadow-sm"
                    disabled={isLoading || isStreaming}
                    rows={1}
                  />
                  <div className="absolute bottom-3 right-3">
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || isStreaming || !message.trim()}
                      size="icon"
                      className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Enzonic AI may make mistakes. Check important info.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>

      {/* Sign In Overlay for Guests */}
      <SignedOut>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 shadow-2xl border-2">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Enzonic AI</h2>
                  <p className="text-muted-foreground">
                    Sign in to start chatting with our AI assistants
                  </p>
                </div>
                <div className="space-y-3">
                  <SignInButton mode="modal">
                    <Button className="w-full" size="lg">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="outline" className="w-full" size="lg">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                  </SignUpButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SignedOut>
    </div>
  );
};

export default Chatbot;