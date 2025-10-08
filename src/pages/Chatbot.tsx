import { useState, useEffect, useRef, useCallback } from "react";
import { SignedIn, SignedOut, useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageCircle, Send, Bot, User, UserPlus, ChevronsUpDown, Check, ArrowUp, Plus, Grid3x3, Moon, Sun, Menu, Trash2, Copy, AlertCircle, ChevronLeft, MoreHorizontal, Download, RotateCcw, Play, ChevronDown, ChevronUp, Sparkles, Brain, Zap, Settings, Square, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { saveChatMessage, getChatHistory, saveChatSession, getChatSessions, deleteChatSession as deleteChatSessionApi, ChatMessage, ChatSession, SaveChatSessionRequest } from "@/lib/chatbotApi";
import { sendChatCompletion, parseStreamingResponse, AI_MODELS, AIModel, ChatCompletionResponse } from "@/lib/aiApi";
import { useServiceStatus, recordActivity } from "@/lib/serviceApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";
import { useTheme } from "@/components/ThemeProvider";
import { ModelAvatar } from "@/components/ui/model-avatar";
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
  const [currentSessionName, setCurrentSessionName] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState("default");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [showThinking, setShowThinking] = useState<{[messageId: string]: boolean}>({});
  const [currentStreamController, setCurrentStreamController] = useState<AbortController | null>(null);
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

  // AI Personalities
  const personalities = [
    {
      id: "default",
      name: "Default",
      prompt: "You are a helpful AI assistant."
    },
    {
      id: "creative",
      name: "Creative Writer",
      prompt: "You are a creative and imaginative writing assistant. You help with storytelling, creative writing, poetry, and artistic expression. You think outside the box and provide unique, inspiring ideas."
    },
    {
      id: "technical",
      name: "Technical Expert",
      prompt: "You are a technical expert and programmer. You provide detailed, accurate technical information, code examples, and solutions to programming problems. You explain complex concepts clearly and concisely."
    },
    {
      id: "teacher",
      name: "Patient Teacher",
      prompt: "You are a patient and encouraging teacher. You break down complex topics into easy-to-understand explanations, provide examples, and adapt your teaching style to help users learn effectively."
    },
    {
      id: "analyst",
      name: "Data Analyst",
      prompt: "You are a data analyst and researcher. You approach problems analytically, provide evidence-based insights, and help with data interpretation, research, and logical reasoning."
    },
    {
      id: "friendly",
      name: "Friendly Companion",
      prompt: "You are a warm, friendly, and empathetic companion. You're supportive, understanding, and always ready to help with a positive attitude. You make conversations enjoyable and engaging."
    }
  ];

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      const settings = {
        personality: selectedPersonality,
        customPrompt: customSystemPrompt,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('enzonic-chat-settings', JSON.stringify(settings));
      toast({
        description: "Settings saved successfully",
        duration: 2000,
      });
    } catch (error) {
      toast({
        description: "Failed to save settings",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('enzonic-chat-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSelectedPersonality(settings.personality || "default");
        setCustomSystemPrompt(settings.customPrompt || "");
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Get current system prompt
  const getCurrentSystemPrompt = () => {
    if (customSystemPrompt.trim()) {
      return customSystemPrompt.trim();
    }
    const personality = personalities.find(p => p.id === selectedPersonality);
    return personality?.prompt || personalities[0].prompt;
  };

  // Generate chat name using the first user message
  const generateChatName = async (firstUserMessage: string, firstAssistantResponse?: string): Promise<string> => {
    console.log('Generating chat name for conversation:', { firstUserMessage, firstAssistantResponse });
    try {
      // Use cubic model to generate a short, descriptive name based on the full conversation context
      const systemPrompt = "Generate a short, descriptive title (2-4 words) for a chat conversation based on the user's question and the assistant's response. Focus on the main topic or task. Only return the title, nothing else. Examples: 'Python Fibonacci Function', 'Recipe Recommendations', 'Travel Planning Help', 'Code Debugging'.";
      
      let userContent = `User asked: "${firstUserMessage}"`;
      if (firstAssistantResponse) {
        // Truncate response if too long for context
        const truncatedResponse = firstAssistantResponse.length > 200 
          ? firstAssistantResponse.substring(0, 200) + "..." 
          : firstAssistantResponse;
        userContent += `\n\nAssistant responded: "${truncatedResponse}"`;
      }
      
      const nameMessages: ChatMessage[] = [
        {
          id: 'system-name',
          content: systemPrompt,
          role: 'system',
          timestamp: new Date().toISOString()
        },
        {
          id: 'user-name',
          content: userContent,
          role: 'user',
          timestamp: new Date().toISOString()
        }
      ];

      console.log('Sending chat name generation request to cubic model with context...');
      const response = await sendChatCompletion(nameMessages, 'cubic', false) as ChatCompletionResponse;
      console.log('Raw cubic response for name generation:', response);
      
      const generatedName = response.choices[0]?.message?.content?.trim() || '';
      console.log('Generated chat name from cubic:', generatedName);
      
      // Clean up the generated name (remove quotes, extra punctuation)
      let cleanName = generatedName.replace(/^["']|["']$/g, '').trim();
      console.log('Cleaned chat name:', cleanName);
      
      // Fallback to first few words if generation fails or is empty
      if (!cleanName || cleanName.length < 3) {
        const fallbackName = firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
        console.log('Using fallback name:', fallbackName);
        return fallbackName;
      }
      
      return cleanName;
    } catch (error) {
      console.error('Failed to generate chat name:', error);
      // Fallback to first few words of the message
      const fallbackName = firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
      console.log('Using error fallback name:', fallbackName);
      return fallbackName;
    }
  };

  // Stop generation function
  const stopGeneration = () => {
    if (currentStreamController) {
      currentStreamController.abort();
      setCurrentStreamController(null);
      setIsStreaming(false);
      setIsLoading(false);
      setStreamingMessage('');
      toast({
        description: "Generation stopped",
        duration: 2000,
      });
    }
  };

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

  // Update page title based on current chat
  useEffect(() => {
    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const chatName = currentSession?.name || 
      (currentSession?.messages[0]?.content?.slice(0, 50)) || 
      "";
    
    if (chatName && chatName.trim()) {
      document.title = `${chatName.trim()}... - Enzonic AI`;
    } else {
      document.title = "New Chat - Enzonic AI";
    }
    
    return () => {
      document.title = "Enzonic AI";
    };
  }, [currentSessionId, chatSessions]);

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

  // Toggle expanded state for long messages
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Check if message is long enough to need expansion
  const isMessageLong = (content: string) => {
    return content.length > 300 || content.split('\n').length > 6;
  };

  // Get truncated content for long messages
  const getTruncatedContent = (content: string) => {
    const lines = content.split('\n');
    if (lines.length > 6) {
      return lines.slice(0, 6).join('\n') + '...';
    }
    if (content.length > 300) {
      return content.substring(0, 300) + '...';
    }
    return content;
  };

  // Format markdown-like text to HTML with enhanced code blocks
  const formatMarkdown = (text: string): string => {
    // Safety check for undefined or null text - updated
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    let codeBlockCounter = 0;
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
        const blockId = `code-block-${codeBlockCounter++}`;
        const lang = language || 'text';
        return `<div class="code-block-container relative bg-muted/50 rounded-lg my-3 border">
          <div class="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border rounded-t-lg">
            <span class="text-xs font-medium text-muted-foreground uppercase">${lang}</span>
            <div class="flex items-center gap-1">
              <button onclick="copyCodeBlock('${blockId}')" class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background/80 hover:bg-background border rounded text-foreground transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Copy
              </button>
              <button onclick="downloadCodeBlock('${blockId}', '${lang}')" class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background/80 hover:bg-background border rounded text-foreground transition-colors">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                </svg>
                Download
              </button>
            </div>
          </div>
          <pre class="overflow-x-auto p-3"><code id="${blockId}" class="language-${lang} text-sm">${code.trim()}</code></pre>
        </div>`;
      })
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');
  };

  // Parse thinking process from AI response
  const parseThinkingFromResponse = (text: string): { thinking: string; response: string } => {
    // Look for thinking tags like <thinking>...</thinking> or [THINKING]...[/THINKING]
    const thinkingPatterns = [
      /<thinking>([\s\S]*?)<\/thinking>/i,
      /\[thinking\]([\s\S]*?)\[\/thinking\]/i,
      /<think>([\s\S]*?)<\/think>/i,
      /\[think\]([\s\S]*?)\[\/think\]/i,
      /^thinking:\s*([\s\S]*?)(?:\n\n|$)/im,
      /^thought process:\s*([\s\S]*?)(?:\n\n|$)/im,
    ];

    for (const pattern of thinkingPatterns) {
      const match = text.match(pattern);
      if (match) {
        const thinking = match[1].trim();
        const response = text.replace(match[0], '').trim();
        return { thinking, response };
      }
    }

    // No thinking found, return original text as response
    return { thinking: '', response: text };
  };

  // Toggle thinking visibility for a message
  const toggleThinking = (messageId: string) => {
    setShowThinking(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Copy code block function
  const copyCodeBlock = async (blockId: string) => {
    try {
      const codeElement = document.getElementById(blockId);
      if (codeElement) {
        await navigator.clipboard.writeText(codeElement.textContent || '');
        toast({
          description: "Code copied to clipboard",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        description: "Failed to copy code",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Download code block function
  const downloadCodeBlock = (blockId: string, language: string) => {
    try {
      const codeElement = document.getElementById(blockId);
      if (codeElement) {
        const code = codeElement.textContent || '';
        const fileExtension = getFileExtension(language);
        const filename = `code.${fileExtension}`;
        
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          description: `Code downloaded as ${filename}`,
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        description: "Failed to download code",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Get file extension based on language
  const getFileExtension = (language: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      'c++': 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      kotlin: 'kt',
      swift: 'swift',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      yml: 'yml',
      markdown: 'md',
      sql: 'sql',
      bash: 'sh',
      shell: 'sh',
      powershell: 'ps1',
      dockerfile: 'dockerfile',
      text: 'txt'
    };
    return extensions[language.toLowerCase()] || 'txt';
  };

  // Regenerate response function
  const regenerateResponse = async (messageIndex: number) => {
    if (messageIndex < 1 || isLoading || isStreaming) return;
    
    // Get all messages up to the one before the assistant message
    const messagesUpToUser = chatHistory.slice(0, messageIndex);
    const lastUserMessage = messagesUpToUser[messagesUpToUser.length - 1];
    
    if (!lastUserMessage || lastUserMessage.role !== 'user') return;
    
    // Remove the assistant message we're regenerating
    setChatHistory(messagesUpToUser);
    setIsLoading(true);
    setError(null);

    try {
      // Send to AI API with streaming
      const stream = await sendChatCompletion(messagesUpToUser, selectedModel, true) as ReadableStream;
      
      setIsLoading(false);
      setIsStreaming(true);
      
      let fullResponse = '';
      
      // Process streaming response
      for await (const chunk of parseStreamingResponse(stream)) {
        fullResponse += chunk;
        setStreamingMessage(fullResponse);
      }

      // Add new assistant message
      const { thinking, response } = parseThinkingFromResponse(fullResponse);
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        model: selectedModel,
        thinking: thinking || undefined
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setStreamingMessage('');
      setIsStreaming(false);

      // Save to backend if user is signed in
      if (isSignedIn) {
        try {
          await saveChatMessage({
            userMessage: lastUserMessage.content,
            assistantMessage: assistantMessage.content,
            model: selectedModel
          }, getToken);
        } catch (error) {
          console.error('Failed to save regenerated message:', error);
        }
      }

    } catch (error) {
      console.error('AI API Error:', error);
      setError("Failed to regenerate response. Please try again.");
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // Continue generating function
  const continueGenerating = async (messageIndex: number) => {
    if (messageIndex >= chatHistory.length || isLoading || isStreaming) return;
    
    const messageToExtend = chatHistory[messageIndex];
    if (messageToExtend.role !== 'assistant') return;
    
    // Prepare messages with continue prompt
    const messagesForContinue = chatHistory.slice(0, messageIndex + 1);
    messagesForContinue.push({
      id: 'continue-prompt',
      content: 'Please continue your previous response.',
      role: 'user',
      timestamp: new Date().toISOString()
    });
    
    setIsLoading(true);
    setError(null);

    try {
      // Send to AI API with streaming
      const stream = await sendChatCompletion(messagesForContinue, selectedModel, true) as ReadableStream;
      
      setIsLoading(false);
      setIsStreaming(true);
      
      let continuedResponse = '';
      
      // Process streaming response
      for await (const chunk of parseStreamingResponse(stream)) {
        continuedResponse += chunk;
        setStreamingMessage(messageToExtend.content + '\n\n' + continuedResponse);
      }

      // Update the existing message with continued content
      const updatedMessages = [...chatHistory];
      updatedMessages[messageIndex] = {
        ...messageToExtend,
        content: messageToExtend.content + '\n\n' + continuedResponse,
        timestamp: new Date().toISOString()
      };

      setChatHistory(updatedMessages);
      setStreamingMessage('');
      setIsStreaming(false);

    } catch (error) {
      console.error('AI API Error:', error);
      setError("Failed to continue generating. Please try again.");
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // Expose functions globally for code block buttons
  useEffect(() => {
    (window as any).copyCodeBlock = copyCodeBlock;
    (window as any).downloadCodeBlock = downloadCodeBlock;
    
    return () => {
      delete (window as any).copyCodeBlock;
      delete (window as any).downloadCodeBlock;
    };
  }, []);

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

  // Save session with specific chat history (for immediate saving)
  const saveCurrentSessionWithHistory = async (historyToSave: ChatMessage[]) => {
    if (!isSignedIn || historyToSave.length === 0) return null;

    try {
      let sessionName = currentSessionName;
      let sessionId = currentSessionId;
      
      // Create a session ID if we don't have one
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentSessionId(sessionId);
      }
      
      // Generate name if this is the first save and we don't have a name
      if (!sessionName) {
        const firstUserMessage = historyToSave.find(msg => msg.role === 'user')?.content;
        const firstAssistantMessage = historyToSave.find(msg => msg.role === 'assistant')?.content;
        if (firstUserMessage) {
          sessionName = await generateChatName(firstUserMessage, firstAssistantMessage);
          setCurrentSessionName(sessionName);
        } else {
          sessionName = "New Chat";
        }
      }

      const sessionData: SaveChatSessionRequest = {
        sessionName: sessionName,
        messages: historyToSave,
        model: selectedModel,
        sessionId: sessionId
      };

      const success = await saveChatSession(sessionData, getToken);
      
      if (success) {
        // Return session data for immediate UI update (don't refresh here to avoid duplicates)
        return {
          id: sessionId,
          name: sessionName,
          messages: historyToSave,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to save session with history:', error);
      return null;
    }
  };

  // Save complete session with auto-generated name
  const saveCurrentSession = async () => {
    return await saveCurrentSessionWithHistory(chatHistory);
  };

  // Refresh sessions list
  const refreshSessions = async () => {
    if (!isSignedIn) return;
    
    try {
      const sessions = await getChatSessions(getToken);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  };

  // Delete a chat session
  const deleteChatSession = async (sessionId: string, sessionName: string) => {
    if (!isSignedIn) return;

    try {
      const success = await deleteChatSessionApi(sessionId, getToken);
      
      if (success) {
        // Remove from local state
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // If we're currently viewing this session, clear the chat
        if (currentSessionId === sessionId) {
          clearChat();
        }
        
        toast({
          description: `Chat "${sessionName}" deleted`,
          duration: 2000,
        });
      } else {
        toast({
          description: "Failed to delete chat",
          variant: "destructive",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        description: "Failed to delete chat",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // Load chat sessions and history on mount
  useEffect(() => {
    if (isSignedIn) {
      const loadData = async () => {
        try {
          const [sessions, messages] = await Promise.all([
            getChatSessions(getToken),
            getChatHistory(getToken)
          ]);
          
          setChatSessions(sessions);
          
          if (currentSessionId) {
            // Load specific session
            const session = sessions.find(s => s.id === currentSessionId);
            if (session) {
              setChatHistory(session.messages);
              setCurrentSessionName(session.name);
            }
          } else if (messages.length > 0) {
            // Load recent messages for backward compatibility
            // Convert ChatHistoryItem[] to ChatMessage[]
            const convertedMessages: ChatMessage[] = [];
            messages.forEach((item, index) => {
              // Add user message
              convertedMessages.push({
                id: `user-${item.id}`,
                content: item.userMessage,
                role: 'user',
                timestamp: item.createdAt
              });
              // Add assistant message
              convertedMessages.push({
                id: `assistant-${item.id}`,
                content: item.assistantMessage,
                role: 'assistant',
                timestamp: item.createdAt,
                model: item.model
              });
            });
            setChatHistory(convertedMessages);
          }
        } catch (error) {
          console.error('Failed to load chat data:', error);
        }
      };

      loadData();
    }
  }, [isSignedIn, getToken, currentSessionId]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || isStreaming) return;

    // Create a new session ID only if we don't have one
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(sessionId);
      console.log('Created new session for first message:', sessionId);
    } else {
      console.log('Using existing session:', sessionId);
    }

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

    // Create abort controller for stopping generation
    const controller = new AbortController();
    setCurrentStreamController(controller);

    try {
      // Prepare messages for AI API with system prompt
      const systemMessage: ChatMessage = {
        id: 'system',
        content: getCurrentSystemPrompt(),
        role: 'system',
        timestamp: new Date().toISOString()
      };
      
      const messagesForApi = [systemMessage, ...chatHistory, userMessage];
      
      // Check if g-coder model should not be streamed
      const shouldStream = selectedModel !== 'g-coder';
      let assistantContent = '';
      
      if (shouldStream) {
        // Send to AI API with streaming
        const stream = await sendChatCompletion(messagesForApi, selectedModel, true) as ReadableStream;
        
        setIsLoading(false);
        setIsStreaming(true);
        
        let fullResponse = '';
        
        // Process streaming response
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            // Check if generation was stopped
            if (controller.signal.aborted) {
              reader.cancel();
              break;
            }
            
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    setStreamingMessage(fullResponse);
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            return; // Generation was stopped
          }
          throw error;
        }

        assistantContent = fullResponse;
        setStreamingMessage('');
        setIsStreaming(false);
      } else {
        // Non-streaming response for g-coder
        const response = await sendChatCompletion(messagesForApi, selectedModel, false) as ChatCompletionResponse;
        assistantContent = response.choices[0]?.message?.content || 'No response received';
        setIsLoading(false);
      }

      // Add complete message to history
      const { thinking, response } = parseThinkingFromResponse(assistantContent);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        model: selectedModel,
        thinking: thinking || undefined
      };

      // Update chat history with assistant message
      const updatedHistory = [...chatHistory, userMessage, assistantMessage];
      setChatHistory(updatedHistory);
      setCurrentStreamController(null);

      // Save complete session (this will generate name for first message)
      if (isSignedIn) {
        try {
          // Save session with the complete history including both user and assistant messages
          setTimeout(async () => {
            try {
              const savedSession = await saveCurrentSessionWithHistory(updatedHistory);
              
              // If this is a new session, add it to the local sessions list
              if (savedSession && !chatSessions.find(s => s.id === savedSession.id)) {
                setChatSessions(prev => [savedSession, ...prev]);
                
                // Show success feedback for new chat
                toast({
                  description: `Chat "${savedSession.name}" saved`,
                  duration: 2000,
                });
              } else if (savedSession) {
                // Update existing session in local state
                setChatSessions(prev => prev.map(s => 
                  s.id === savedSession.id ? savedSession : s
                ));
              }
            } catch (error) {
              console.error('Failed to save session:', error);
            }
          }, 100);
          
          // Also save individual message for backward compatibility
          await saveChatMessage({
            userMessage: userMessage.content,
            assistantMessage: assistantContent,
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
      setCurrentStreamController(null);
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
    setCurrentSessionName("");
    setError(null);
    setShowThinking({});
  };

  const createNewSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(newSessionId);
    setCurrentSessionName(""); // Reset session name
    setChatHistory([]);
    setError(null);
    setShowThinking({}); // Reset thinking display state
    
    // Show feedback to user
    toast({
      description: "New chat created",
      duration: 2000,
    });
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
    return <ServiceUnavailable serviceName="Chatbot" />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SignedIn>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className={cn(
            "flex-shrink-0 border-r border-border bg-card transition-all duration-300",
            sidebarOpen ? "w-72" : "w-0 overflow-hidden"
          )}>
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-semibold text-foreground">Enzonic AI</span>
                  </div>
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
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Chat Sessions List */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-1 py-2">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative rounded-md transition-colors hover:bg-accent/50",
                        currentSessionId === session.id && "bg-accent"
                      )}
                    >
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-auto p-2 text-left pr-8",
                          currentSessionId === session.id && "bg-transparent text-accent-foreground"
                        )}
                        onClick={() => switchToSession(session)}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <MessageCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="text-sm truncate">
                            {session.name || session.messages[0]?.content?.slice(0, 30) || 'New Chat'}
                          </span>
                        </div>
                      </Button>
                      
                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                            title="Delete chat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{session.name || 'Untitled Chat'}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteChatSession(session.id, session.name || 'Untitled Chat')}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Sidebar Footer - User Profile and Services */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-center gap-4">
                  {/* Theme Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Apps Grid */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Grid3x3 className="h-4 w-4" />
                        <span className="sr-only">Apps menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-0 w-80">
                      <AppGrid />
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* User Profile */}
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 rounded-full border border-border"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col relative bg-background">
            {/* Background for empty state */}
            {chatHistory.length === 0 && !isStreaming && !isLoading && (
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,119,198,0.1),transparent_50%)]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(120,120,120,.02)_25%,rgba(120,120,120,.02)_50%,transparent_50%,transparent_75%,rgba(120,120,120,.02)_75%)] bg-[length:60px_60px]"></div>
                  
                  {/* Floating elements */}
                  <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-xl animate-pulse delay-1000"></div>
                  <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-xl animate-pulse delay-2000"></div>
                </div>
              </div>
            )}

            {/* Header - Only show when not in empty state */}
            {(chatHistory.length > 0 || isStreaming || isLoading) && (
              <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 relative z-10">
                <div className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    {/* Left side - Sidebar toggle and Model selector */}
                    <div className="flex items-center gap-4">
                      {!sidebarOpen && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSidebarOpen(true)}
                          className="h-9 w-9"
                        >
                          <Menu className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Popover open={modelOpen} onOpenChange={setModelOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="rounded-lg border px-4 py-2 h-9 text-sm font-medium"
                            disabled={isLoading || isStreaming}
                          >
                            <ModelAvatar 
                              model={models.find((model) => model.id === selectedModel)} 
                              size="sm" 
                              className="mr-2" 
                            />
                            {models.find((model) => model.id === selectedModel)?.name}
                            <ChevronsUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
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
                                    className="flex items-center gap-3 p-3 min-h-[60px]"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 flex-shrink-0",
                                        selectedModel === model.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <ModelAvatar 
                                      model={model} 
                                      size="md" 
                                      className="flex-shrink-0" 
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="font-medium text-foreground truncate">{model.name}</div>
                                      <div className="text-sm text-muted-foreground break-words leading-tight">{model.description}</div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Right side - Settings when messages exist */}
                    <div className="flex items-center gap-2">
                      {/* Settings removed - now in floating corner */}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto relative">
              {chatHistory.length === 0 && !isStreaming && !isLoading ? (
                <div className="flex flex-col h-full relative z-10">
                  {/* Floating Controls - Model selector (top-left) and Settings (top-right) */}
                  <div className="absolute top-4 left-4 z-20">
                    <Popover open={modelOpen} onOpenChange={setModelOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-10 px-4 text-left justify-between min-w-[200px] bg-background/90 backdrop-blur-sm border-border"
                          disabled={isLoading || isStreaming}
                        >
                          <div className="flex items-center gap-3">
                            <ModelAvatar 
                              model={models.find(m => m.id === selectedModel)} 
                              size="sm" 
                            />
                            <span className="font-medium">{models.find((model) => model.id === selectedModel)?.name}</span>
                          </div>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <Command>
                          <CommandInput placeholder="Search models..." />
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
                                  className="flex items-center gap-3 p-3 min-h-[60px]"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 flex-shrink-0",
                                      selectedModel === model.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <ModelAvatar 
                                    model={model} 
                                    size="md" 
                                    className="flex-shrink-0" 
                                  />
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate">{model.name}</div>
                                    <div className="text-sm text-muted-foreground break-words leading-tight">{model.description}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="absolute top-4 right-4 z-20">
                    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm border-border">
                          <Settings className="w-4 h-4 mr-2" />
                          AI Settings
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Chat Settings
                          </SheetTitle>
                        </SheetHeader>
                        
                        <div className="space-y-6 mt-6">
                          {/* AI Personality Selection */}
                          <div>
                            <Label htmlFor="personality" className="text-sm font-medium">
                              AI Personality
                            </Label>
                            <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                              <SelectTrigger className="w-full mt-2">
                                <SelectValue placeholder="Select personality" />
                              </SelectTrigger>
                              <SelectContent>
                                {personalities.map((personality) => (
                                  <SelectItem key={personality.id} value={personality.id}>
                                    {personality.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              {personalities.find(p => p.id === selectedPersonality)?.prompt}
                            </p>
                          </div>

                          <Separator />

                          {/* Custom System Prompt */}
                          <div>
                            <Label htmlFor="customPrompt" className="text-sm font-medium">
                              Custom System Prompt
                            </Label>
                            <Textarea
                              id="customPrompt"
                              placeholder="Enter a custom system prompt (overrides personality)..."
                              value={customSystemPrompt}
                              onChange={(e) => setCustomSystemPrompt(e.target.value)}
                              className="mt-2 min-h-[100px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Leave blank to use the selected personality prompt.
                            </p>
                          </div>

                          <Separator />

                          {/* Current System Prompt Preview */}
                          <div>
                            <Label className="text-sm font-medium">Current System Prompt</Label>
                            <div className="mt-2 p-3 bg-muted rounded-md text-xs text-muted-foreground">
                              {getCurrentSystemPrompt()}
                            </div>
                          </div>

                          <Separator />

                          {/* Thinking Feature Info */}
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Brain className="w-4 h-4" />
                              AI Thinking Process
                            </Label>
                            <div className="mt-2 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
                              <p className="mb-2">
                                When AI models show their reasoning process, you'll see a "Show thinking" button above responses.
                              </p>
                              <p>
                                The AI can include thinking in responses using tags like{' '}
                                <code className="bg-background px-1 rounded">&lt;thinking&gt;...&lt;/thinking&gt;</code> or{' '}
                                <code className="bg-background px-1 rounded">[thinking]...[/thinking]</code>
                              </p>
                            </div>
                          </div>

                          {/* Save Button */}
                          <Button onClick={saveSettings} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Main content area */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-6 max-w-2xl mx-auto">
                      {/* Simple logo and title */}
                      <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-6">
                          <Sparkles className="w-8 h-8 text-primary-foreground" />
                        </div>
                        
                        <h1 className="text-4xl font-bold mb-4 text-foreground">
                          How can I help you today?
                        </h1>
                        
                        <p className="text-muted-foreground mb-8">
                          Start chatting with Enzonic AI
                        </p>
                      </div>

                      {/* Simple suggestions */}
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                        <Button
                          variant="ghost"
                          className="w-full text-left justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => setMessage("Help me write a professional email")}
                        >
                          → Help me write a professional email
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-left justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => setMessage("Explain quantum computing in simple terms")}
                        >
                          → Explain quantum computing in simple terms
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-left justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => setMessage("Write a Python function to sort a list")}
                        >
                          → Write a Python function to sort a list
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-left justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => setMessage("Show your thinking process: solve 2+2×3 step by step")}
                        >
                          → Show your thinking process: solve 2+2×3 step by step
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Floating Message Input */}
                  <div className="flex-shrink-0 p-6">
                    <div className="max-w-3xl mx-auto">
                      <div className="relative bg-background/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-2xl">
                        <Textarea
                          ref={textareaRef}
                          placeholder="How can I help you today?"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="min-h-[64px] max-h-[200px] resize-none border-0 bg-transparent pr-16 text-lg leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                          disabled={isLoading || isStreaming}
                          rows={1}
                        />
                        <div className="absolute bottom-3 right-3">
                          {isLoading || isStreaming ? (
                            <Button
                              onClick={stopGeneration}
                              size="icon"
                              variant="destructive"
                              className="h-10 w-10 rounded-xl"
                            >
                              <Square className="w-5 h-5" />
                            </Button>
                          ) : (
                            <Button
                              onClick={handleSendMessage}
                              disabled={!message.trim()}
                              size="icon"
                              className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50"
                            >
                              <ArrowUp className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Enzonic AI can make mistakes, please double check responses.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto px-6 py-8">
                  <div className="space-y-6">
                    {chatHistory.filter(msg => msg && msg.content).map((msg, index) => (
                      <div key={msg.id} className={cn(
                        "flex items-start gap-3 group",
                        msg.role === 'user' ? 'justify-end' : ''
                      )}>
                        {msg.role === 'user' ? (
                          // User message - right aligned with bubble
                          <div className="max-w-2xl">
                            <div className="bg-primary text-primary-foreground rounded-xl rounded-br-md px-4 py-3">
                              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content || ''}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* AI Avatar */}
                            <ModelAvatar 
                              model={msg.model ? models.find(m => m.id === msg.model) : undefined} 
                              size="md" 
                              className="flex-shrink-0" 
                            />

                            {/* AI Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-foreground text-sm">
                                  {msg.model ? models.find(m => m.id === msg.model)?.name : 'Assistant'}
                                </span>
                              </div>
                              <div className="text-foreground leading-relaxed">
                                {/* Thinking Process Display */}
                                {msg.thinking && (
                                  <div className="mb-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleThinking(msg.id)}
                                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 h-8 px-2"
                                    >
                                      <Brain className="w-4 h-4" />
                                      <span className="text-xs">
                                        {showThinking[msg.id] ? 'Hide thinking' : 'Show thinking'}
                                      </span>
                                      {showThinking[msg.id] ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </Button>
                                    
                                    {showThinking[msg.id] && (
                                      <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Brain className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-sm font-medium text-muted-foreground">Thinking process</span>
                                        </div>
                                        <div 
                                          className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                                          dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.thinking) }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Main Response */}
                                <div 
                                  className="prose prose-sm max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content || '') }}
                                />
                                
                                {/* Action buttons for assistant messages */}
                                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(msg.content)}
                                    className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                                    title="Copy message"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => regenerateResponse(index)}
                                    className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                                    disabled={isLoading || isStreaming}
                                    title="Regenerate response"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => continueGenerating(index)}
                                    className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                                    disabled={isLoading || isStreaming}
                                    title="Continue generating"
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Streaming Message */}
                    {isStreaming && streamingMessage && (
                      <div className="flex items-start gap-3 group">
                        <ModelAvatar 
                          model={models.find(m => m.id === selectedModel)} 
                          size="md" 
                          className="flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-foreground text-sm">
                              {models.find(m => m.id === selectedModel)?.name}
                            </span>
                          </div>
                          
                          {/* Parse and display thinking in real-time for streaming */}
                          {(() => {
                            const { thinking, response } = parseThinkingFromResponse(streamingMessage || '');
                            return (
                              <>
                                {thinking && (
                                  <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Brain className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-muted-foreground">Thinking...</span>
                                      <div className="w-2 h-2 bg-primary/60 animate-pulse rounded-full ml-1"></div>
                                    </div>
                                    <div 
                                      className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                                      dangerouslySetInnerHTML={{ __html: formatMarkdown(thinking) }}
                                    />
                                  </div>
                                )}
                                <div 
                                  className="prose prose-sm max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={{ __html: formatMarkdown(response) }}
                                />
                              </>
                            );
                          })()}
                          
                          <div className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-1"></div>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {isLoading && !isStreaming && (
                      <div className="flex items-start gap-3">
                        <ModelAvatar 
                          model={models.find(m => m.id === selectedModel)} 
                          size="md" 
                          className="flex-shrink-0" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
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
                        <div className="w-7 h-7 rounded-full bg-destructive flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-destructive-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground text-sm">Error</span>
                          </div>
                          <div className="text-destructive text-sm mb-2">
                            {error}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (chatHistory.length > 0) {
                                  const lastUserMessage = chatHistory[chatHistory.length - 1];
                                  if (lastUserMessage && lastUserMessage.role === 'user') {
                                    setMessage(lastUserMessage.content);
                                  }
                                }
                                setError(null);
                              }}
                              className="h-7 px-3 text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Try Again
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setError(null)}
                              className="h-7 px-2 text-xs hover:bg-muted/50"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input Area - Only for when there are messages */}
            {(chatHistory.length > 0 || isStreaming || isLoading) && (
              <div className="flex-shrink-0 bg-background relative">
                <div className="max-w-4xl mx-auto p-6">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder="How can I help you today?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[52px] max-h-[200px] resize-none rounded-xl border bg-background pr-12 text-base leading-relaxed focus:border-primary w-full"
                      disabled={isLoading || isStreaming}
                      rows={1}
                    />
                    <div className="absolute bottom-2 right-2">
                      {isLoading || isStreaming ? (
                        <Button
                          onClick={stopGeneration}
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-lg"
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim()}
                          size="icon"
                          className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Enzonic AI can make mistakes, please double check responses.</span>
                  </div>
                </div>
              </div>
            )}
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