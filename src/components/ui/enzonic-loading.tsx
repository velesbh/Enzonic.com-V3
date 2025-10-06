import { cn } from "@/lib/utils";
import { Loader2, Zap } from "lucide-react";

interface EnzonicLoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
  variant?: "default" | "minimal" | "pulse";
  showLogo?: boolean;
}

export const EnzonicLoading = ({ 
  size = "md", 
  message = "Enzonic is loading...", 
  className,
  variant = "default",
  showLogo = true
}: EnzonicLoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const containerSizeClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4", 
    xl: "gap-6"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          {message}
        </span>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
        <div className="relative">
          <div className={cn(
            "rounded-full bg-primary/20 animate-ping absolute",
            sizeClasses[size]
          )} />
          <div className={cn(
            "rounded-full bg-primary/10 animate-pulse",
            sizeClasses[size]
          )} />
          {showLogo && (
            <Zap className={cn(
              "absolute inset-0 m-auto text-primary animate-pulse",
              size === "sm" ? "h-2 w-2" :
              size === "md" ? "h-4 w-4" :
              size === "lg" ? "h-6 w-6" :
              "h-8 w-8"
            )} />
          )}
        </div>
        <span className={cn("text-center text-muted-foreground font-medium", textSizeClasses[size])}>
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={cn(
          "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
          sizeClasses[size]
        )} />
        
        {/* Inner pulsing logo */}
        {showLogo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className={cn(
              "text-primary animate-pulse",
              size === "sm" ? "h-2 w-2" :
              size === "md" ? "h-4 w-4" :
              size === "lg" ? "h-6 w-6" :
              "h-8 w-8"
            )} />
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className={cn("font-semibold text-foreground", textSizeClasses[size])}>
          Enzonic
        </p>
        <p className={cn("text-muted-foreground", 
          size === "sm" ? "text-xs" :
          size === "md" ? "text-sm" :
          size === "lg" ? "text-base" :
          "text-lg"
        )}>
          {message}
        </p>
      </div>
      
      {/* Loading dots animation */}
      <div className="flex gap-1 mt-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-primary animate-bounce",
              size === "sm" ? "h-1 w-1" :
              size === "md" ? "h-1.5 w-1.5" :
              size === "lg" ? "h-2 w-2" :
              "h-3 w-3"
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "0.6s"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Full page loading component
export const EnzonicPageLoading = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <EnzonicLoading size="xl" message={message} />
    </div>
  );
};

// Overlay loading component
export const EnzonicOverlayLoading = ({ 
  message = "Processing...",
  show = true 
}: { 
  message?: string;
  show?: boolean;
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-2xl shadow-2xl border">
        <EnzonicLoading size="lg" message={message} />
      </div>
    </div>
  );
};

export default EnzonicLoading;