import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Enhanced404Page } from "@/components/ui/enzonic-error";

const NotFound = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Custom metadata for 404 page
    document.title = "404 - Page Not Found | Enzonic LLC";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'The page you are looking for does not exist. Return to Enzonic LLC homepage.');
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', '404 - Page Not Found | Enzonic LLC');
    }
    
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/logo.png';
    }
  }, [location.pathname]);

  return <Enhanced404Page />;
};

export default NotFound;
