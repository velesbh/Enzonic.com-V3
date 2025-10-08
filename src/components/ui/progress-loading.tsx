import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Zap, Upload, Download, RefreshCw } from "lucide-react";

interface ProgressLoadingProps {
  progress: number;
  message?: string;
  variant?: "default" | "upload" | "download" | "processing";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressLoading = ({
  progress,
  message,
  variant = "default",
  size = "md",
  showPercentage = true,
  animated = true,
  className
}: ProgressLoadingProps) => {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const getIcon = () => {
    switch (variant) {
      case "upload":
        return <Upload className={cn("text-primary", iconSizeClasses[size], animated && "animate-pulse")} />;
      case "download":
        return <Download className={cn("text-primary", iconSizeClasses[size], animated && "animate-pulse")} />;
      case "processing":
        return <RefreshCw className={cn("text-primary", iconSizeClasses[size], animated && "animate-spin")} />;
      default:
        return <Zap className={cn("text-primary", iconSizeClasses[size], animated && "animate-pulse")} />;
    }
  };

  const getMessage = () => {
    if (message) return message;
    switch (variant) {
      case "upload":
        return "Uploading...";
      case "download":
        return "Downloading...";
      case "processing":
        return "Processing...";
      default:
        return "Loading...";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with icon and message */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
            {getMessage()}
          </span>
        </div>
        {showPercentage && (
          <span className={cn("font-mono text-muted-foreground", textSizeClasses[size])}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress 
          value={progress} 
          className={cn("transition-all duration-300", sizeClasses[size])}
        />
        
        {/* Animated shimmer effect */}
        {animated && progress < 100 && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        )}
      </div>

      {/* Additional progress indicators */}
      {progress < 100 && animated && (
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-primary animate-bounce",
                size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2"
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.6s"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Specialized progress components
export const UploadProgress = (props: Omit<ProgressLoadingProps, 'variant'>) => (
  <ProgressLoading variant="upload" {...props} />
);

export const DownloadProgress = (props: Omit<ProgressLoadingProps, 'variant'>) => (
  <ProgressLoading variant="download" {...props} />
);

export const ProcessingProgress = (props: Omit<ProgressLoadingProps, 'variant'>) => (
  <ProgressLoading variant="processing" {...props} />
);

// Multi-step progress component
interface MultiStepProgressProps {
  steps: Array<{
    label: string;
    completed: boolean;
    active?: boolean;
  }>;
  className?: string;
}

export const MultiStepProgress = ({ steps, className }: MultiStepProgressProps) => {
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">{completedSteps} of {totalSteps} completed</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200",
              step.completed 
                ? "bg-green-500 text-white" 
                : step.active 
                  ? "bg-primary text-primary-foreground animate-pulse" 
                  : "bg-muted text-muted-foreground"
            )}>
              {step.completed ? "✓" : index + 1}
            </div>
            <span className={cn(
              "text-sm transition-all duration-200",
              step.completed 
                ? "text-green-600 font-medium" 
                : step.active 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};