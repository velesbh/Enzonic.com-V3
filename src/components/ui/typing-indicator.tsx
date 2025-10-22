import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isTyping?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

export const TypingIndicator = ({
  isTyping = true,
  size = "md",
  className,
  message = "Enzonic is typing"
}: TypingIndicatorProps) => {
  const sizeClasses = {
    sm: {
      container: "text-xs",
      bar: "w-1 h-3",
    },
    md: {
      container: "text-sm",
      bar: "w-1.5 h-4",
    },
    lg: {
      container: "text-base",
      bar: "w-2 h-5",
    }
  };

  if (!isTyping) return null;

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/50 w-fit",
      sizeClasses[size].container,
      className
    )}>
      <div className="flex space-x-1 items-end">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-primary rounded-sm animate-bar-wave",
              sizeClasses[size].bar
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      {message && (
        <span className="text-muted-foreground font-medium">{message}...</span>
      )}
    </div>
  );
};

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
  const [displayText, setDisplayText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
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

  return (
    <span className={cn("font-mono", className)}>
      {displayText}
      {showCursor && (
        <span className={cn(
          "inline-block w-0.5 h-5 bg-primary ml-1 animate-cursor-blink"
        )} />
      )}
    </span>
  );
};

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
        <span className="inline-block w-1 h-5 bg-primary ml-1 animate-cursor-blink" />
      )}
    </div>
  );
};

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
          message=""
        />
      </div>
    </div>
  );
};
