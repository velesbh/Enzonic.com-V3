import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
const logo = "/logo.png";
const Newsletter = () => {
  const [email, setEmail] = useState("");
  const {
    toast
  } = useToast();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    // Mock newsletter signup
    toast({
      title: "Success!",
      description: "You've been subscribed to our newsletter."
    });
    setEmail("");
  };
  return <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="container mx-auto px-3 sm:px-4 relative w-full">
        <div className="max-w-2xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in bg-card/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl border-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 animate-scale-in shadow-lg">
            <Mail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
          </div>

          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-xl overflow-hidden flex items-center justify-center bg-background/50 flex-shrink-0">
                <img src={logo} alt="Enzonic Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Stay Updated</h2>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-0">Subscribe to our newsletter for the latest updates from Enzonic</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full px-2 sm:px-0">
            <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-full border-2 focus:border-primary shadow-sm w-full" />
            <Button type="submit" className="rounded-full whitespace-nowrap shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
              Subscribe
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            By subscribing, you agree to our{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </section>;
};
export default Newsletter;