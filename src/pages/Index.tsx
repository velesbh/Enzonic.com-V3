import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Team from "@/components/Team";
import Newsletter from "@/components/Newsletter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, Users, Sparkles } from "lucide-react";
const Index = () => {
  return <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 w-full">
        <Hero />

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Mission Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Mission</h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">Proving things can be done different, prioritizing users over company gains as well as being fully ethical. </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
              <Card className="animate-fade-in [animation-delay:100ms] shadow-lg hover:shadow-xl transition-shadow border-2 w-full">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Users className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl">User-Centric</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    We put our users first, prioritizing their needs over profit margins
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:200ms] shadow-lg hover:shadow-xl transition-shadow border-2 w-full">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Recycle className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl">Trying to be Eco-Friendly</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Committed to sustainable practices and environmental responsibility
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="animate-fade-in [animation-delay:300ms] shadow-lg hover:shadow-xl transition-shadow border-2 w-full">
                <CardHeader className="p-4 sm:p-5 md:p-6">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <Sparkles className="h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 text-primary" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl">Innovative</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Proving that things can be done differently with creative solutions
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <Team />
        
        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <Newsletter />
      </main>

      <Footer />
    </div>;
};
export default Index;