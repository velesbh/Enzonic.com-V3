import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServiceUnavailableProps {
  serviceName: string;
  description?: string;
  icon?: React.ReactNode;
}

const ServiceUnavailable = ({ 
  serviceName, 
  description = "This service is currently disabled by the administrator.",
  icon
}: ServiceUnavailableProps) => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 mx-auto flex items-center justify-center">
              {icon || <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />}
            </div>
            <CardTitle className="text-2xl">Service Unavailable</CardTitle>
            <CardDescription className="text-lg font-medium">
              {serviceName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {description}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              
              <Button 
                onClick={handleGoHome} 
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                If you believe this is an error, please contact support or try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceUnavailable;