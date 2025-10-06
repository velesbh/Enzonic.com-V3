import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  className?: string;
  variant?: "card" | "page" | "inline";
}

export const EnzonicError = ({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  error,
  onRetry,
  onGoHome,
  onGoBack,
  showRetry = true,
  showHome = true,
  showBack = false,
  className,
  variant = "card"
}: ErrorBoundaryProps) => {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;

  const ErrorContent = () => (
    <>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className={cn(
            "font-semibold",
            variant === "page" ? "text-2xl" : "text-lg"
          )}>
            {title}
          </h2>
          <p className="text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        
        {errorMessage && (
          <Alert className="max-w-md text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error details:</strong> {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {showBack && onGoBack && (
            <Button variant="outline" onClick={onGoBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
          {showHome && onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </>
  );

  if (variant === "page") {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", className)}>
        <div className="max-w-md w-full">
          <ErrorContent />
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("p-4", className)}>
        <ErrorContent />
      </div>
    );
  }

  return (
    <Card className={cn("max-w-md mx-auto", className)}>
      <CardContent className="pt-6">
        <ErrorContent />
      </CardContent>
    </Card>
  );
};

// Enhanced 404 Page Component
export const Enhanced404Page = () => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center space-y-8 max-w-lg">
        {/* 404 Animation */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-primary animate-pulse">
            404
          </div>
          <div className="text-2xl font-semibold text-foreground">
            Page Not Found
          </div>
          <p className="text-muted-foreground text-lg">
            The page you're looking for seems to have wandered off into the digital void.
          </p>
        </div>

        {/* Enzonic Branding */}
        <div className="py-4">
          <div className="text-sm text-muted-foreground">
            You're still with <span className="font-semibold text-primary">Enzonic</span> - 
            proving things can be done different
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleGoHome} size="lg" className="gap-2">
            <Home className="h-5 w-5" />
            Back to Home
          </Button>
          <Button variant="outline" onClick={handleGoBack} size="lg" className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Or explore our services:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="/translate">Translate</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/boxes">Boxes</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/emi">Emi Bot</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/shows">Shows</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnzonicError;