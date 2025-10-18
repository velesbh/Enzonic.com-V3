import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { Shield, Cookie, FileText } from "lucide-react";

export default function TermsAcceptanceDialog() {
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(true);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  useEffect(() => {
    // Check if user has already accepted terms
    const accepted = localStorage.getItem("enzonic_terms_accepted");
    if (!accepted) {
      // Show dialog after a short delay for better UX
      setTimeout(() => setOpen(true), 500);
    }
  }, []);

  const handleAccept = () => {
    if (!termsAccepted) {
      return; // Don't allow proceeding without accepting terms
    }

    // Save acceptance
    const acceptance = {
      terms: true,
      analytics: analyticsAccepted,
      marketing: marketingAccepted,
      timestamp: new Date().toISOString(),
      version: "1.0"
    };

    localStorage.setItem("enzonic_terms_accepted", JSON.stringify(acceptance));
    
    // Set cookie preferences
    if (analyticsAccepted) {
      localStorage.setItem("enzonic_analytics_enabled", "true");
    }
    if (marketingAccepted) {
      localStorage.setItem("enzonic_marketing_enabled", "true");
    }

    setOpen(false);
  };

  const handleDecline = () => {
    // Redirect to external page or show message
    window.location.href = "https://google.com";
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-primary" />
            Welcome to Enzonic
          </DialogTitle>
          <DialogDescription>
            Before you start using our services, please review and accept our terms.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Terms of Service Summary */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Terms of Service</h3>
                  <p className="text-muted-foreground mb-2">
                    By using Enzonic, you agree to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Use our services responsibly and legally</li>
                    <li>Not misuse our AI, search, or translation features</li>
                    <li>Respect our rate limits and usage policies</li>
                    <li>Acknowledge that AI responses are provided as-is</li>
                    <li>Understand search results are from third-party sources</li>
                    <li>Accept that currency rates are for informational purposes only</li>
                  </ul>
                  <Link 
                    to="/terms" 
                    target="_blank"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Read full Terms of Service →
                  </Link>
                </div>
              </div>
            </div>

            {/* Privacy Policy Summary */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Privacy Policy</h3>
                  <p className="text-muted-foreground mb-2">
                    We respect your privacy:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Search history stored locally in your browser only</li>
                    <li>AI conversations may be used to improve our models</li>
                    <li>We use Clerk for authentication (see their privacy policy)</li>
                    <li>Anonymous analytics help us improve our services</li>
                    <li>You can delete your data anytime</li>
                    <li>We comply with GDPR and CCPA</li>
                  </ul>
                  <Link 
                    to="/privacy" 
                    target="_blank"
                    className="text-primary hover:underline inline-block mt-2"
                  >
                    Read full Privacy Policy →
                  </Link>
                </div>
              </div>
            </div>

            {/* Cookie Settings */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-2">
                <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-3">Cookie & Data Preferences</h3>
                  
                  <div className="space-y-4">
                    {/* Essential - Always Required */}
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox 
                        checked={true} 
                        disabled 
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Essential</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Required for core functionality (authentication, preferences, security). 
                          Cannot be disabled.
                        </div>
                      </div>
                    </div>

                    {/* Analytics - Optional but Recommended */}
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Checkbox 
                        checked={analyticsAccepted}
                        onCheckedChange={(checked) => setAnalyticsAccepted(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Analytics (Recommended)</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Help us understand usage patterns and improve our services. 
                          Includes page views, feature usage, and error tracking (anonymized).
                        </div>
                      </div>
                    </div>

                    {/* Marketing - Optional */}
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <Checkbox 
                        checked={marketingAccepted}
                        onCheckedChange={(checked) => setMarketingAccepted(checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">Marketing (Optional)</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Receive updates about new features, improvements, and Enzonic news. 
                          We'll never spam you.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="flex items-start gap-2 flex-1 text-xs">
            <Checkbox 
              id="accept-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <label htmlFor="accept-terms" className="text-muted-foreground cursor-pointer">
              I have read and accept the{" "}
              <Link to="/terms" target="_blank" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleDecline}
              className="flex-1 sm:flex-none"
            >
              Decline & Leave
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!termsAccepted}
              className="flex-1 sm:flex-none"
            >
              Accept & Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
