import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isTyping?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "dots" | "bars" | "wave" | "pulse";
  className?: string;
  message?: string;
}

export const TypingIndicator = ({
  isTyping = true,
  size = "md",
  variant = "dots",
  className,
  message = "Enzonic is typing"
}: TypingIndicatorProps) => {
  const sizeClasses = {
    sm: {
      container: "text-xs",
      dot: "w-1.5 h-1.5",
      bar: "w-1 h-3",
      wave: "w-1 h-4"
    },
    md: {
      container: "text-sm",
      dot: "w-2 h-2",
      bar: "w-1.5 h-4",
      wave: "w-1.5 h-5"
    },
    lg: {
      container: "text-base",
      dot: "w-2.5 h-2.5",
      bar: "w-2 h-5",
      wave: "w-2 h-6"
    }
  };

  if (!isTyping) return null;

  const renderIndicator = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-primary rounded-full animate-bounce",
                  sizeClasses[size].dot
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "0.8s"
                }}
              />
            ))}
          </div>
        );

      case "bars":
        return (
          <div className="flex space-x-1 items-end">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-primary rounded-sm animate-wave",
                  sizeClasses[size].bar
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.6s"
                }}
              />
            ))}
          </div>
        );

      case "wave":
        return (
          <div className="flex space-x-0.5 items-end">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-primary rounded-full",
                  sizeClasses[size].wave
                )}
                style={{
                  animation: `wave 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                  transformOrigin: "center bottom"
                }}
              />
            ))}
          </div>
        );

      case "pulse":
        return (
          <div className="flex space-x-2 items-center">
            <div className={cn(
              "bg-primary rounded-full animate-pulse",
              sizeClasses[size].dot
            )} />
            <div className={cn(
              "bg-primary/60 rounded-full animate-pulse",
              sizeClasses[size].dot
            )} style={{ animationDelay: "0.2s" }} />
            <div className={cn(
              "bg-primary/40 rounded-full animate-pulse",
              sizeClasses[size].dot
            )} style={{ animationDelay: "0.4s" }} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/50 w-fit",
      sizeClasses[size].container,
      className
    )}>
      {renderIndicator()}
      <span className="text-muted-foreground font-medium">{message}...</span>
    </div>
  );
};

// Enhanced typing effect with text animation
interface TypewriterProps {
  text: string;
  speed?: number;
  showCursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

export const Typewriter = ({
  text,
  speed = 50,
  showCursor = true,
  className,
  onComplete
}: TypewriterProps) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursorBlink, setShowCursorBlink] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursorBlink(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className={cn("font-mono", className)}>
      {displayText}
      {showCursor && (
        <span className={cn(
          "inline-block w-0.5 h-5 bg-primary ml-1 transition-opacity duration-100",
          showCursorBlink ? "opacity-100" : "opacity-0"
        )} />
      )}
    </span>
  );
};

// Streaming text component for AI responses
interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export const StreamingText = ({
  text,
  isStreaming,
  className
}: StreamingTextProps) => {
  return (
    <div className={cn("relative", className)}>
      <span className="whitespace-pre-wrap">{text}</span>
      {isStreaming && (
        <span className="inline-block w-1 h-5 bg-primary ml-1 animate-pulse" />
      )}
    </div>
  );
};

// Chat bubble with typing animation
interface ChatBubbleLoadingProps {
  variant?: "user" | "ai";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ChatBubbleLoading = ({
  variant = "ai",
  size = "md",
  className
}: ChatBubbleLoadingProps) => {
  const sizeClasses = {
    sm: "p-2 text-xs",
    md: "p-3 text-sm",
    lg: "p-4 text-base"
  };

  return (
    <div className={cn(
      "flex items-center",
      variant === "user" ? "justify-end" : "justify-start",
      className
    )}>
      <div className={cn(
        "rounded-2xl border backdrop-blur-sm max-w-xs",
        sizeClasses[size],
        variant === "user" 
          ? "bg-primary text-primary-foreground border-primary/20 rounded-br-md" 
          : "bg-muted/50 text-foreground border-border/50 rounded-bl-md"
      )}>
        <TypingIndicator
          size={size}
          variant="dots"
          message=""
        />
      </div>
    </div>
  );
};