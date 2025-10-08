import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnzonicLoading, EnzonicPageLoading, EnzonicOverlayLoading } from "@/components/ui/enzonic-loading";
import { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText } from "@/components/ui/skeleton";
import { LoadingButton, SendButton, SubmitButton } from "@/components/ui/loading-button";
import { ProgressLoading, UploadProgress, DownloadProgress, ProcessingProgress, MultiStepProgress } from "@/components/ui/progress-loading";
import { TypingIndicator, Typewriter, StreamingText, ChatBubbleLoading } from "@/components/ui/typing-indicator";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const LoadingAnimationsDemo = () => {
  const [loadingStates, setLoadingStates] = useState({
    button1: false,
    button2: false,
    button3: false,
    sendButton: false,
    submitButton: false,
    showOverlay: false,
    showPageLoading: false
  });
  
  const [progress, setProgress] = useState(65);
  const [isTyping, setIsTyping] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const [typewriterText] = useState("Welcome to Enzonic's enhanced loading animations! ✨");
  const [streamText] = useState("This is an example of streaming text that appears as if it's being typed in real-time by an AI assistant...");

  const [multiStepProgress] = useState([
    { label: "Initializing", completed: true },
    { label: "Loading models", completed: true },
    { label: "Processing request", completed: false, active: true },
    { label: "Generating response", completed: false },
    { label: "Finalizing", completed: false }
  ]);

  const toggleLoading = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Auto-reset after 3 seconds
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const variants = ["default", "minimal", "pulse", "orbit", "sparkle", "wave", "particle"] as const;

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Enhanced Loading Animations
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive collection of beautiful, smooth, and engaging loading animations for Enzonic applications.
          </p>
        </div>

        {/* EnzonicLoading Variants */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>EnzonicLoading Component Variants</CardTitle>
            <CardDescription>
              Different animation styles for various use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {variants.map((variant) => (
                <div key={variant} className="flex flex-col items-center space-y-3 p-4 border rounded-lg">
                  <Badge variant="outline" className="mb-2">{variant}</Badge>
                  <EnzonicLoading variant={variant} size="md" message="Loading..." />
                </div>
              ))}
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <h4 className="font-semibold">Small Size</h4>
                <EnzonicLoading variant="sparkle" size="sm" message="Processing..." />
              </div>
              <div className="text-center space-y-3">
                <h4 className="font-semibold">Large Size</h4>
                <EnzonicLoading variant="orbit" size="lg" message="Analyzing..." />
              </div>
              <div className="text-center space-y-3">
                <h4 className="font-semibold">Extra Large</h4>
                <EnzonicLoading variant="particle" size="xl" message="Initializing..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enhanced Loading Buttons</CardTitle>
            <CardDescription>
              Interactive buttons with loading states and animations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <LoadingButton
                loading={loadingStates.button1}
                loadingText="Processing..."
                loadingVariant="spinner"
                onClick={() => toggleLoading('button1')}
                className="w-full"
              >
                Spinner Loading
              </LoadingButton>
              
              <LoadingButton
                loading={loadingStates.button2}
                loadingText="Sending..."
                loadingVariant="dots"
                onClick={() => toggleLoading('button2')}
                className="w-full"
              >
                Dots Animation
              </LoadingButton>
              
              <LoadingButton
                loading={loadingStates.button3}
                loadingText="Uploading..."
                loadingVariant="wave"
                onClick={() => toggleLoading('button3')}
                className="w-full"
              >
                Wave Animation
              </LoadingButton>
              
              <SendButton
                loading={loadingStates.sendButton}
                loadingText="Sending message..."
                onClick={() => toggleLoading('sendButton')}
                className="w-full"
              >
                Send Message
              </SendButton>
              
              <SubmitButton
                loading={loadingStates.submitButton}
                onClick={() => toggleLoading('submitButton')}
                className="w-full"
              >
                Submit Form
              </SubmitButton>
              
              <LoadingButton
                successState={true}
                successText="Completed!"
                className="w-full"
              >
                Success State
              </LoadingButton>
            </div>
          </CardContent>
        </Card>

        {/* Progress Loading */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress Loading Components</CardTitle>
            <CardDescription>
              For operations with measurable progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Upload Progress</h4>
                <UploadProgress progress={progress} message="Uploading files..." />
                
                <h4 className="font-semibold">Download Progress</h4>
                <DownloadProgress progress={85} message="Downloading data..." />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Processing Progress</h4>
                <ProcessingProgress progress={progress} message="Processing images..." />
                
                <h4 className="font-semibold">Custom Progress</h4>
                <ProgressLoading 
                  progress={progress} 
                  message="Custom operation..." 
                  variant="default"
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-4">Multi-Step Progress</h4>
              <MultiStepProgress steps={multiStepProgress} />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setProgress(Math.max(0, progress - 10))}
                size="sm"
                variant="outline"
              >
                Decrease Progress
              </Button>
              <Button 
                onClick={() => setProgress(Math.min(100, progress + 10))}
                size="sm"
                variant="outline"
              >
                Increase Progress
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Typing and Chat Animations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Typing & Chat Animations</CardTitle>
            <CardDescription>
              Perfect for chatbots and messaging interfaces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Typing Indicators</h4>
                <TypingIndicator isTyping={isTyping} variant="dots" />
                <TypingIndicator isTyping={isTyping} variant="bars" />
                <TypingIndicator isTyping={isTyping} variant="wave" />
                <TypingIndicator isTyping={isTyping} variant="pulse" />
                
                <Button 
                  onClick={() => setIsTyping(!isTyping)}
                  size="sm"
                  variant="outline"
                >
                  Toggle Typing
                </Button>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Chat Bubbles</h4>
                <ChatBubbleLoading variant="ai" />
                <ChatBubbleLoading variant="user" />
                
                <h4 className="font-semibold">Streaming Text</h4>
                <div className="p-3 border rounded-lg">
                  <StreamingText 
                    text={streamText} 
                    isStreaming={isStreaming}
                  />
                </div>
                
                <Button 
                  onClick={() => setIsStreaming(!isStreaming)}
                  size="sm"
                  variant="outline"
                >
                  Toggle Streaming
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-4">Typewriter Effect</h4>
              <div className="p-4 border rounded-lg bg-muted/50">
                <Typewriter 
                  text={typewriterText}
                  speed={50}
                  showCursor={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Loading */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enhanced Skeleton Loading</CardTitle>
            <CardDescription>
              Shimmer effects for content placeholders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Basic Skeletons</h4>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Avatar Skeletons</h4>
                <div className="flex items-center space-x-3">
                  <SkeletonAvatar size="sm" />
                  <SkeletonText lines={2} />
                </div>
                <div className="flex items-center space-x-3">
                  <SkeletonAvatar size="lg" />
                  <SkeletonText lines={3} />
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Card Skeleton</h4>
                <SkeletonCard />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overlay and Page Loading */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Full Screen Loading</CardTitle>
            <CardDescription>
              For page transitions and overlay states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={() => setLoadingStates(prev => ({ ...prev, showOverlay: true }))}
                variant="outline"
              >
                Show Overlay Loading
              </Button>
              
              <Button 
                onClick={() => setLoadingStates(prev => ({ ...prev, showPageLoading: true }))}
                variant="outline"
              >
                Show Page Loading
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Note */}
        <Card>
          <CardHeader>
            <CardTitle>Performance & Accessibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">All animations use CSS transforms and opacity for optimal performance</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">Animations respect user's motion preferences</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">Loading states provide clear feedback and are screen reader friendly</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">Shimmer effects use GPU acceleration for smooth performance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overlay Loading */}
      <EnzonicOverlayLoading 
        show={loadingStates.showOverlay}
        message="Processing your request..."
        variant="orbit"
        onClose={() => setLoadingStates(prev => ({ ...prev, showOverlay: false }))}
      />

      {/* Page Loading Demo (Modal-like) */}
      {loadingStates.showPageLoading && (
        <div className="fixed inset-0 z-50">
          <EnzonicPageLoading 
            message="Loading Enzonic experience..."
            variant="sparkle"
          />
          <Button
            onClick={() => setLoadingStates(prev => ({ ...prev, showPageLoading: false }))}
            className="absolute top-4 right-4 z-51"
            variant="outline"
            size="sm"
          >
            Close Demo
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoadingAnimationsDemo;