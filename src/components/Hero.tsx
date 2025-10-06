import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";
const Hero = () => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };
  return <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="container mx-auto px-3 sm:px-4 relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8 py-6 sm:py-8">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium animate-fade-in shadow-lg">
            <img src={logo} alt="Enzonic Logo" className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="whitespace-nowrap">Enzonic: A new start</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight px-2 sm:px-4 animate-fade-in [animation-delay:100ms]">
            Introducing{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent break-words">Enzonic V3</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-3 sm:px-4 animate-fade-in [animation-delay:200ms]">At Enzonic, we prioritize users over company gains.
Empowering individuals and businesses with innovative, affordable, and accessible services</p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-3 sm:px-4 animate-fade-in [animation-delay:300ms]">
            <Button asChild size="lg" className="rounded-full w-full sm:w-auto shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Link to="/support">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full w-full sm:w-auto border-2 hover:bg-primary/10 transition-all">
              <Link to="#team">Meet Our Team</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button onClick={scrollToContent} className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10 hover:text-primary transition-colors" aria-label="Scroll to content">
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>;
};
export default Hero;