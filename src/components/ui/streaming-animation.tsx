import React from "react";
import { cn } from "@/lib/utils";

interface StreamingCursorProps {
  className?: string;
}

/**
 * Simple blinking cursor animation
 */
export const StreamingCursor = ({
  className
}: StreamingCursorProps) => {
  return (
    <span className={cn(
      "inline-block w-1 h-5 bg-primary ml-1 animate-cursor-blink",
      className
    )} />
  );
};

interface GeneratingIndicatorProps {
  message?: string;
  className?: string;
}

/**
 * Simple bars loading animation
 */
export const GeneratingIndicator = ({
  message = "Generating",
  className
}: GeneratingIndicatorProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-3 bg-primary rounded-sm animate-bar-wave"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      {message && (
        <span className="text-muted-foreground font-medium text-sm">{message}...</span>
      )}
    </div>
  );
};
