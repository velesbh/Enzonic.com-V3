import { Link } from "react-router-dom";
import { Home, Languages, MessageCircle, Server, Brain, Tv, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const apps = [
  { name: "Search", path: "/", icon: Home },
  { name: "About", path: "/about", icon: Info },
  { name: "Enzonic Emi", path: "/emi", icon: Brain },
  { name: "Chatbot", path: "/chatbot", icon: MessageCircle },
  { name: "Boxes", path: "/boxes", icon: Server },
  { name: "Translate", path: "/translate", icon: Languages },
  { name: "Enzonic Shows", path: "/shows", icon: Tv },
];

const AppGrid = () => {
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const handleAppClick = (path: string) => {
    setLoadingApp(path);
    // Reset loading state after a short delay to show the animation
    setTimeout(() => setLoadingApp(null), 1000);
  };

  return (
    <div className="w-80 p-6 bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 supports-[backdrop-filter]:bg-card/90 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/10 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 relative z-10">
        {apps.map((app) => {
          const Icon = app.icon;
          const isLoading = loadingApp === app.path;
          
          return (
            <Link
              key={app.path}
              to={app.path}
              onClick={() => handleAppClick(app.path)}
              className={cn(
                "flex flex-col items-center justify-start p-3 rounded-2xl transition-all group min-h-[100px] text-center backdrop-blur-sm relative overflow-hidden",
                "hover:bg-primary/10 hover:scale-105 hover:shadow-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                isLoading && "scale-95 opacity-75"
              )}
            >
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center rounded-2xl">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-primary rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: "0.6s"
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* App icon with enhanced animations */}
              <div className={cn(
                "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 transition-all shadow-md backdrop-blur-sm relative overflow-hidden",
                "group-hover:bg-primary/20 group-hover:shadow-lg group-hover:scale-110",
                "group-focus:bg-primary/20 group-focus:shadow-lg",
                isLoading && "animate-pulse-glow"
              )}>
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                
                <Icon className={cn(
                  "h-6 w-6 text-primary transition-all duration-300",
                  "group-hover:scale-110 group-hover:drop-shadow-lg",
                  isLoading && "animate-pulse"
                )} />
              </div>

              {/* App name with loading state */}
              <span className={cn(
                "text-xs font-medium leading-tight text-center w-full break-normal whitespace-normal transition-all duration-200",
                "group-hover:text-primary/80",
                isLoading && "text-primary/60"
              )}>
                {isLoading ? "Loading..." : app.name}
              </span>

              {/* Ripple effect on click */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 group-active:animate-ping bg-primary/20 transition-opacity" />
            </Link>
          );
        })}
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );
};

export default AppGrid;
