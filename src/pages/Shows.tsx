import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tv, Video, Clapperboard, Sparkles } from "lucide-react";
const Shows = () => {
  return <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto shadow-lg">
                <Tv className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">ENZONIC SHOWS</h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">Content, that is just simply different from other corporate companies</p>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* About Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full">
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="max-w-4xl mx-auto space-y-8">
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl">What Are Enzonic Shows?</CardTitle>
                  <CardDescription className="text-base">A different kind of content experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm sm:text-base">
                  <p className="text-muted-foreground">
                    Enzonic Shows is our unique content series, primarily portrayed in Minecraft, that combines 
                    humor with education. Each episode features funny videos, detailed infographics, and 
                    engaging storytelling that entertains while informing.
                  </p>
                  <p className="text-muted-foreground">
                    We believe entertainment doesn't have to be mindless, and education doesn't have to be boring. 
                    Through creative Minecraft builds, animated sequences, and witty narration, we tackle topics 
                    ranging from technology to environmental issues to just pure fun.
                  </p>
                </CardContent>
              </Card>

              {/* Content Types */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
                  <CardHeader className="p-4 sm:p-5">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 shadow-md">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Podcasts and Stories</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Awesome content made by Enzonic llc
to entertain you!</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
                  <CardHeader className="p-4 sm:p-5">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 shadow-md">
                      <Clapperboard className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Infographics</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Visual breakdowns of complex topics in easy-to-understand formats
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow border-2">
                  <CardHeader className="p-4 sm:p-5">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 shadow-md">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">Recorded in Minecraft</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Fully recorded directly in minecraft</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Coming Soon Section */}
        <section className="py-12 sm:py-16 md:py-20 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-transparent" />
          <div className="container mx-auto px-3 sm:px-4 relative w-full">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Coming Soon</h2>
              <p className="text-sm sm:text-base text-muted-foreground">We're working hard to bring you the video of Enzonic Shows. Stay tuned for updates on when Videos will start dropping!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button size="lg" variant="outline" disabled>YouTube</Button>
                <Button size="lg" variant="default">
                  Subscribe for Updates
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default Shows;