import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, Zap, Send, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  loadingVariant?: "spinner" | "pulse" | "dots" | "wave";
  icon?: React.ReactNode;
  successState?: boolean;
  successText?: string;
  successDuration?: number;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    loading = false,
    loadingText,
    loadingVariant = "spinner",
    icon,
    successState = false,
    successText,
    successDuration = 2000,
    className,
    disabled,
    ...props
  }, ref) => {
    const [showSuccess, setShowSuccess] = React.useState(false);

    React.useEffect(() => {
      if (successState) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), successDuration);
        return () => clearTimeout(timer);
      }
    }, [successState, successDuration]);

    const renderLoadingIndicator = () => {
      switch (loadingVariant) {
        case "spinner":
          return <Loader2 className="h-4 w-4 animate-spin" />;
        case "pulse":
          return <Zap className="h-4 w-4 animate-pulse" />;
        case "dots":
          return (
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-current rounded-full animate-bounce"
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
            <div className="flex space-x-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 h-3 bg-current rounded-full animate-wave"
                  style={{
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          );
        default:
          return <Loader2 className="h-4 w-4 animate-spin" />;
      }
    };

    if (showSuccess) {
      return (
        <Button
          ref={ref}
          className={cn(
            "relative overflow-hidden bg-green-600 hover:bg-green-700 transition-all duration-300",
            className
          )}
          disabled={true}
          {...props}
        >
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 animate-in zoom-in-75 duration-300" />
            <span>{successText || "Success!"}</span>
          </div>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          loading && "cursor-not-allowed",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        <div className={cn(
          "flex items-center space-x-2 transition-all duration-200",
          loading && "opacity-100"
        )}>
          {loading ? (
            <>
              {renderLoadingIndicator()}
              <span>{loadingText || "Loading..."}</span>
            </>
          ) : (
            <>
              {icon && <span className="flex items-center">{icon}</span>}
              <span>{children}</span>
            </>
          )}
        </div>
        
        {/* Loading backdrop effect */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

// Specialized loading buttons
export const SendButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'icon'>>(
  (props, ref) => (
    <LoadingButton
      ref={ref}
      icon={<Send className="h-4 w-4" />}
      loadingVariant="pulse"
      {...props}
    />
  )
);

SendButton.displayName = "SendButton";

export const SubmitButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loadingText = "Submitting...", ...props }, ref) => (
    <LoadingButton
      ref={ref}
      loadingText={loadingText}
      loadingVariant="dots"
      {...props}
    />
  )
);

SubmitButton.displayName = "SubmitButton";