import { useState, useEffect, useRef } from "react";
import { SignedIn, SignedOut, useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ArrowUp, Plus, Grid3x3, Copy, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useServiceStatus, recordActivity } from "@/lib/serviceApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";
import { useTheme } from "@/components/ThemeProvider";
import AppGrid from "@/components/AppGrid";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  model?: string;
}

const Chatbot = () => {
  usePageMetadata();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("cubic");
  const [modelOpen, setModelOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { getToken, isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Check service availability
  const { status: serviceStatus, loading: serviceLoading } = useServiceStatus('chatbot');

  // Available models
  const models = [
    { id: "cubic", name: "Cubic", description: "Balanced model for general conversations" },
    { id: "nexara", name: "Nexara", description: "Advanced reasoning and analysis" },
    { id: "zixen", name: "Zixen", description: "Creative and imaginative responses" },
    { id: "g-coder", name: "G-Coder", description: "Specialized for coding and technical tasks" }
  ];

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
      // Simulate streaming response
      setIsStreaming(true);
      setIsLoading(false);
      
      // Mock AI response - replace with actual API call
      const responses = [
        "I understand your question! Let me help you with that.",
        "That's an interesting point. Here's what I think about it...",
        "Great question! Based on my knowledge, I can tell you that...",
        "I'd be happy to help you with that. Here's my response...",
        "Thanks for asking! Let me break this down for you..."
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      const words = response.split(' ');
      
      let currentMessage = '';
      for (let i = 0; i < words.length; i++) {
        currentMessage += (i > 0 ? ' ' : '') + words[i];
        setStreamingMessage(currentMessage);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Add complete message to history
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        model: selectedModel
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setStreamingMessage('');
      setIsStreaming(false);

    } catch (error) {
      setError("Failed to get response. Please try again.");
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
    setError(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading screen while checking service status
  if (serviceLoading) {
    return <EnzonicLoading />;
  }

  // Show service unavailable if the chatbot service is down
  if (serviceStatus !== 'operational') {
    return <ServiceUnavailable service="Chatbot" />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SignedIn>
        <div className="flex h-screen">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="max-w-4xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* Left side - Model selector */}
                  <Popover open={modelOpen} onOpenChange={setModelOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full border-2 hover:bg-primary/10"
                        disabled={isLoading || isStreaming}
                      >
                        {models.find((model) => model.id === selectedModel)?.name}
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
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {model.name.substring(0, 2)}
                                  </span>
                                </div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-sm text-muted-foreground">{model.description}</div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Right side - New Chat, Apps, User */}
                  <div className="flex items-center gap-3">
                    {/* New Chat Button */}
                    <Button
                      variant="outline"
                      onClick={clearChat}
                      className="rounded-full border-2 hover:bg-primary/10"
                      disabled={isLoading || isStreaming}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>

                    {/* Apps Grid */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-all h-10 w-10">
                          <Grid3x3 className="h-5 w-5" />
                          <span className="sr-only">Apps menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-0 border-2">
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