import { useEffect, useState } from "react";

interface ServiceLoadingOverlayProps {
  isLoading: boolean;
}

const ServiceLoadingOverlay = ({ isLoading }: ServiceLoadingOverlayProps) => {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState<'entering' | 'exiting' | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Show overlay and slide in from left
      setShow(true);
      setTimeout(() => setAnimate('entering'), 10);
    } else if (show) {
      // Slide out to the right
      setAnimate('exiting');
      setTimeout(() => {
        setShow(false);
        setAnimate(null);
      }, 500); // Match animation duration
    }
  }, [isLoading, show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center transition-transform duration-500 ease-in-out overflow-hidden ${
        animate === 'entering' 
          ? 'translate-x-0' 
          : animate === 'exiting'
          ? 'translate-x-full'
          : '-translate-x-full'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      {/* Animated background lines - circuit-like paths */}
      <div className="absolute inset-0 overflow-hidden opacity-50">
        {/* Path 1: L-shaped path drawing from top-left */}
        <svg className="absolute top-10 left-10 w-96 h-96" viewBox="0 0 400 400">
          <path
            d="M 0 0 L 200 0 L 200 200"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
            fill="none"
            className="animate-draw-path-1"
            strokeDasharray="400"
            strokeDashoffset="400"
          />
        </svg>

        {/* Path 2: Zigzag from top-right */}
        <svg className="absolute top-20 right-20 w-80 h-80" viewBox="0 0 300 300">
          <path
            d="M 300 0 L 200 0 L 200 100 L 100 100 L 100 200"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
            fill="none"
            className="animate-draw-path-2"
            strokeDasharray="500"
            strokeDashoffset="500"
          />
        </svg>

        {/* Path 3: Stepped path bottom-left */}
        <svg className="absolute bottom-16 left-16 w-72 h-72" viewBox="0 0 300 300">
          <path
            d="M 0 300 L 0 200 L 150 200 L 150 100 L 300 100"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
            fill="none"
            className="animate-draw-path-3"
            strokeDasharray="600"
            strokeDashoffset="600"
          />
        </svg>

        {/* Path 4: Complex path bottom-right */}
        <svg className="absolute bottom-10 right-24 w-64 h-64" viewBox="0 0 250 250">
          <path
            d="M 250 250 L 180 250 L 180 150 L 80 150 L 80 50 L 0 50"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
            fill="none"
            className="animate-draw-path-4"
            strokeDasharray="550"
            strokeDashoffset="550"
          />
        </svg>

        {/* Path 5: Center crossing paths */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96" viewBox="0 0 400 400">
          <path
            d="M 0 200 L 150 200 L 150 100 L 250 100 L 250 300"
            stroke="rgb(34 197 94)"
            strokeWidth="2"
            fill="none"
            className="animate-draw-path-5"
            strokeDasharray="500"
            strokeDashoffset="500"
          />
        </svg>

        {/* Small accent paths */}
        <svg className="absolute top-1/3 left-1/4 w-40 h-40" viewBox="0 0 150 150">
          <path
            d="M 0 75 L 50 75 L 50 0"
            stroke="rgb(34 197 94)"
            strokeWidth="1.5"
            fill="none"
            className="animate-draw-path-6"
            strokeDasharray="125"
            strokeDashoffset="125"
          />
        </svg>

        <svg className="absolute top-2/3 right-1/3 w-40 h-40" viewBox="0 0 150 150">
          <path
            d="M 150 0 L 100 0 L 100 75 L 0 75"
            stroke="rgb(34 197 94)"
            strokeWidth="1.5"
            fill="none"
            className="animate-draw-path-7"
            strokeDasharray="225"
            strokeDashoffset="225"
          />
        </svg>
      </div>

      {/* Main content with floating animation */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-float">
        {/* Large spinning loader with glow */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 animate-pulse">
            <div className="h-20 w-20 -m-2 rounded-full bg-primary/20 blur-xl"></div>
          </div>
          
          {/* Main spinner */}
          <div className="relative animate-spin-slow">
            <div className="h-16 w-16 border-4 border-primary/30 border-t-primary border-r-primary rounded-full"></div>
          </div>
          
          {/* Inner rotating element */}
          <div className="absolute inset-0 flex items-center justify-center animate-spin-reverse">
            <div className="h-8 w-8 border-2 border-primary/50 border-b-transparent rounded-full"></div>
          </div>
          
          {/* Center dot pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 bg-primary rounded-full animate-ping"></div>
            <div className="absolute h-2 w-2 bg-primary rounded-full"></div>
          </div>
        </div>
        
        {/* Loading text with subtle animation */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
            Loading Services...
          </h2>
          <p className="text-sm text-muted-foreground animate-fade-in-out">Checking service availability</p>
        </div>

        {/* Animated dots with wave effect */}
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce-wave" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce-wave" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce-wave" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ServiceLoadingOverlay;
