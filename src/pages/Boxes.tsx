import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Server, Shield, Trash2, Monitor, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useServiceStatus, recordActivity } from "@/lib/serviceApi";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { EnzonicLoading } from "@/components/ui/enzonic-loading";

const Boxes = () => {
  usePageMetadata();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const isMobile = useIsMobile();
  const [tosAccepted, setTosAccepted] = useState(false);
  const [showTosDialog, setShowTosDialog] = useState(false);
  const [tempTosAccept, setTempTosAccept] = useState(false);

  // Check service availability
  const { status: serviceStatus, loading: serviceLoading } = useServiceStatus('boxes');

  useEffect(() => {
    if (user) {
      const accepted = localStorage.getItem(`boxes_tos_${user.id}`);
      if (!accepted) {
        setShowTosDialog(true);
      } else {
        setTosAccepted(true);
      }
    }
  }, [user]);

  // Record page view activity
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const token = isSignedIn ? await getToken() : undefined;
        await recordActivity('page_view', {
          page: 'boxes',
          url: window.location.href
        }, token);
      } catch (error) {
        // Silently fail for analytics
        console.debug('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [isSignedIn, getToken]);

  const handleAcceptTos = async () => {
    if (tempTosAccept && user) {
      localStorage.setItem(`boxes_tos_${user.id}`, "true");
      setTosAccepted(true);
      setShowTosDialog(false);
      
      // Record TOS acceptance
      try {
        const token = await getToken();
        await recordActivity('tos_accepted', {
          service: 'boxes',
          userId: user.id
        }, token);
      } catch (error) {
        console.debug('Failed to track TOS acceptance:', error);
      }
    }
  };

  const handleLaunchBoxes = async () => {
    try {
      const token = await getToken();
      await recordActivity('service_launch', {
        service: 'boxes',
        action: 'launch_vm'
      }, token);
    } catch (error) {
      console.debug('Failed to track service launch:', error);
    }
    
    window.open("https://boxesthree.enzonic.me/#/cast/chrome", "_blank");
  };

  // If service is not available, show unavailable page
  if (!serviceLoading && serviceStatus && !serviceStatus.available) {
    return (
      <ServiceUnavailable 
        serviceName="Boxes" 
        description="The Boxes virtual machine service is currently disabled by the administrator."
        icon={<Package className="h-8 w-8 text-orange-600 dark:text-orange-400" />}
      />
    );
  }

  // Show loading while checking service status
  if (serviceLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <EnzonicLoading size="lg" message="Checking service availability..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <Navbar />
      
      <SignedOut>
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <Server className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to sign in to access Boxes virtual machines.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </div>
        </main>
      </SignedOut>

      <SignedIn>
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
            <div className="container mx-auto px-3 sm:px-4 relative w-full">
              <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Boxes Virtual Machine</h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
                  Secure, isolated browser sessions powered by Kasm
                </p>
              </div>

              <Alert className="mb-8 border-yellow-500/50 bg-yellow-500/10 max-w-3xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Beta Service</AlertTitle>
                <AlertDescription>
                  Boxes is currently in beta and may have bugs, glitches, and could be discontinued at any time. Use at your own discretion.
                </AlertDescription>
              </Alert>

              {isMobile ? (
                <Card className="max-w-2xl mx-auto shadow-lg border-2">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto shadow-md">
                      <Monitor className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">Desktop Only</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Boxes requires a desktop or laptop computer to function properly. Please access this service from a PC.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto mb-8">
                    <Card className="animate-fade-in [animation-delay:100ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                      <CardHeader className="p-4 sm:p-5 md:p-6">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                          <Trash2 className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                        </div>
                        <CardTitle className="text-base sm:text-lg md:text-xl">Auto-Delete Sessions</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Sessions are deleted after you finish
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <Card className="animate-fade-in [animation-delay:200ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                      <CardHeader className="p-4 sm:p-5 md:p-6">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                          <Shield className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                        </div>
                        <CardTitle className="text-base sm:text-lg md:text-xl">Fully Isolated</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Complete isolation from your system
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <Card className="animate-fade-in [animation-delay:300ms] shadow-lg hover:shadow-xl transition-shadow border-2">
                      <CardHeader className="p-4 sm:p-5 md:p-6">
                        <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                          <Server className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                        </div>
                        <CardTitle className="text-base sm:text-lg md:text-xl">Cloud-Based</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          No local resources required
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {tosAccepted ? (
                    <Card className="max-w-2xl mx-auto shadow-lg border-2">
                      <CardHeader className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto shadow-md">
                          <Server className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl">Launch Virtual Machine</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                          Click the button below to open your isolated browser session in a new tab.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center pb-6">
                        <Button 
                          size="lg"
                          onClick={handleLaunchBoxes}
                          className="shadow-lg hover:shadow-xl transition-shadow"
                        >
                          Launch Boxes Browser
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-6">
                          By using this service, you agree to our{" "}
                          <a href="/terms" target="_blank" className="text-primary hover:underline">
                            Terms of Service
                          </a>
                          . Enzonic LLC is not liable for any actions performed within the virtual machine.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="max-w-2xl mx-auto shadow-lg border-2">
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">Please accept the Terms of Service to continue</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Separator */}
          <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </main>
      </SignedIn>

      <Footer />

      <Dialog open={showTosDialog} onOpenChange={setShowTosDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Terms of Service</DialogTitle>
            <DialogDescription>
              Before using Boxes, you must agree to our terms and conditions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Enzonic LLC is not liable for any actions, content, or activities performed within the Boxes virtual machine environment. 
                Sessions are isolated and automatically deleted. This service is provided "as-is" and may be discontinued at any time.
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-2">
              <Checkbox 
                id="tos-accept" 
                checked={tempTosAccept}
                onCheckedChange={(checked) => setTempTosAccept(checked === true)}
              />
              <label htmlFor="tos-accept" className="text-sm leading-tight cursor-pointer">
                I have read and agree to the{" "}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and understand that Enzonic LLC is not responsible for my actions within the virtual machine.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/")}>Cancel</Button>
            <Button onClick={handleAcceptTos} disabled={!tempTosAccept}>
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Boxes;
