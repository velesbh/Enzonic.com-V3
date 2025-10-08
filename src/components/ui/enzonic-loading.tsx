import { cn } from "@/lib/utils";
import { Loader2, Zap, Sparkles, Orbit } from "lucide-react";

interface EnzonicLoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
  variant?: "default" | "minimal" | "pulse" | "orbit" | "sparkle" | "wave" | "particle";
  showLogo?: boolean;
  animated?: boolean;
}

export const EnzonicLoading = ({ 
  size = "md", 
  message = "Enzonic is loading...", 
  className,
  variant = "default",
  showLogo = true,
  animated = true
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

  if (variant === "orbit") {
    return (
      <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
        <div className="relative">
          {/* Orbiting particles */}
          <div className={cn("relative", sizeClasses[size])}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 bg-primary rounded-full animate-spin",
                  size === "sm" ? "w-1 h-1" :
                  size === "md" ? "w-2 h-2" :
                  size === "lg" ? "w-3 h-3" :
                  "w-4 h-4"
                )}
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: `${size === "sm" ? "8px" : size === "md" ? "16px" : size === "lg" ? "24px" : "32px"} 0`,
                  transform: `translate(-50%, -50%) rotate(${i * 120}deg)`,
                  animationDuration: "2s",
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          {/* Center logo */}
          {showLogo && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              sizeClasses[size]
            )}>
              <Orbit className={cn(
                "text-primary animate-pulse",
                size === "sm" ? "h-2 w-2" :
                size === "md" ? "h-4 w-4" :
                size === "lg" ? "h-6 w-6" :
                "h-8 w-8"
              )} />
            </div>
          )}
        </div>
        <span className={cn("text-center text-muted-foreground font-medium", textSizeClasses[size])}>
          {message}
        </span>
      </div>
    );
  }

  if (variant === "sparkle") {
    return (
      <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
        <div className="relative">
          {/* Sparkle animation */}
          <div className={cn("relative", sizeClasses[size])}>
            {[...Array(6)].map((_, i) => (
              <Sparkles
                key={i}
                className={cn(
                  "absolute text-primary animate-ping",
                  size === "sm" ? "h-1 w-1" :
                  size === "md" ? "h-2 w-2" :
                  size === "lg" ? "h-3 w-3" :
                  "h-4 w-4"
                )}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: "1.5s"
                }}
              />
            ))}
          </div>
          {/* Center logo */}
          {showLogo && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              sizeClasses[size]
            )}>
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
        <span className={cn("text-center text-muted-foreground font-medium", textSizeClasses[size])}>
          {message}
        </span>
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-primary rounded-full animate-bounce",
                size === "sm" ? "w-1 h-3" :
                size === "md" ? "w-2 h-6" :
                size === "lg" ? "w-3 h-9" :
                "w-4 h-12"
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.8s"
              }}
            />
          ))}
        </div>
        <span className={cn("text-center text-muted-foreground font-medium mt-2", textSizeClasses[size])}>
          {message}
        </span>
      </div>
    );
  }

  if (variant === "particle") {
    return (
      <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
        <div className="relative">
          {/* Main container */}
          <div className={cn("relative", sizeClasses[size])}>
            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-1 h-1 bg-primary rounded-full animate-ping",
                  size === "sm" ? "w-0.5 h-0.5" :
                  size === "md" ? "w-1 h-1" :
                  size === "lg" ? "w-1.5 h-1.5" :
                  "w-2 h-2"
                )}
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
            {/* Center pulse */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-primary/20 animate-pulse"
            )} />
          </div>
          {/* Center logo */}
          {showLogo && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              sizeClasses[size]
            )}>
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
        <span className={cn("text-center text-muted-foreground font-medium", textSizeClasses[size])}>
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", containerSizeClasses[size], className)}>
      <div className="relative">
        {/* Outer spinning ring with gradient */}
        <div className={cn(
          "animate-spin rounded-full border-2 border-transparent bg-gradient-to-r from-primary via-primary/50 to-transparent bg-clip-border",
          sizeClasses[size]
        )} style={{
          background: `conic-gradient(from 0deg, transparent, var(--primary), transparent)`,
          borderRadius: '50%',
          padding: '2px'
        }}>
          <div className={cn(
            "rounded-full bg-background",
            size === "sm" ? "h-3 w-3" :
            size === "md" ? "h-7 w-7" :
            size === "lg" ? "h-11 w-11" :
            "h-15 w-15"
          )} />
        </div>
        
        {/* Inner secondary ring */}
        <div className={cn(
          "absolute inset-1 animate-spin rounded-full border border-primary/30",
          size === "sm" ? "inset-0.5" : "inset-1"
        )} style={{
          animationDirection: 'reverse',
          animationDuration: '3s'
        }} />
        
        {/* Inner pulsing logo with glow effect */}
        {showLogo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "relative flex items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm",
              size === "sm" ? "w-2 h-2" :
              size === "md" ? "w-6 h-6" :
              size === "lg" ? "w-8 h-8" :
              "w-10 h-10"
            )}>
              <Zap className={cn(
                "text-primary animate-pulse drop-shadow-lg",
                size === "sm" ? "h-1 w-1" :
                size === "md" ? "h-3 w-3" :
                size === "lg" ? "h-4 w-4" :
                "h-5 w-5"
              )} style={{
                filter: 'drop-shadow(0 0 4px hsl(var(--primary)))',
                animationDuration: '2s'
              }} />
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className={cn("font-semibold text-foreground animate-pulse", textSizeClasses[size])}>
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
      
      {/* Enhanced loading dots animation with stagger effect */}
      <div className="flex gap-1 mt-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-gradient-to-r from-primary to-primary/60 animate-bounce shadow-lg",
              size === "sm" ? "h-1 w-1" :
              size === "md" ? "h-1.5 w-1.5" :
              size === "lg" ? "h-2 w-2" :
              "h-3 w-3"
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.8s",
              boxShadow: `0 0 8px hsl(var(--primary)/0.5)`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Full page loading component with enhanced backdrop
export const EnzonicPageLoading = ({ 
  message = "Loading...",
  variant = "default" 
}: { 
  message?: string;
  variant?: "default" | "minimal" | "pulse" | "orbit" | "sparkle" | "wave" | "particle";
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/10 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Main loading component */}
      <div className="relative z-10">
        <EnzonicLoading size="xl" message={message} variant={variant} />
      </div>
    </div>
  );
};

// Enhanced overlay loading component
export const EnzonicOverlayLoading = ({ 
  message = "Processing...",
  show = true,
  variant = "default",
  blur = true,
  onClose
}: { 
  message?: string;
  show?: boolean;
  variant?: "default" | "minimal" | "pulse" | "orbit" | "sparkle" | "wave" | "particle";
  blur?: boolean;
  onClose?: () => void;
}) => {
  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300",
        blur ? "bg-background/80 backdrop-blur-sm" : "bg-background/60"
      )}
      onClick={onClose}
    >
      {/* Animated backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-primary/20 rounded-full animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random()}s`
            }}
          />
        ))}
      </div>
      
      {/* Loading card with enhanced styling */}
      <div 
        className="bg-card/95 p-8 rounded-2xl shadow-2xl border border-border/50 backdrop-blur-xl relative z-10 transform scale-100 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <EnzonicLoading size="lg" message={message} variant={variant} />
      </div>
    </div>
  );
};

export default EnzonicLoading;