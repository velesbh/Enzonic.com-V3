import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
const logo = "/logo.png";

const teamMembers = [
  { name: "Veles BH", role: "Co-Founder" },
  { name: "Sawyer", role: "Co-Founder" },
  { name: "Luke", role: "Co-Founder" },
  { name: "Aaron", role: "Co-Founder" },
];

const Team = () => {
  return (
    <section id="team" className="py-12 sm:py-16 md:py-20 relative w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      <div className="container mx-auto px-3 sm:px-4 relative w-full">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-xl overflow-hidden flex items-center justify-center bg-background/50">
              <img src={logo} alt="Enzonic Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Meet Our Team</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
            The creative minds behind Enzonic's innovation and excellence
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
          {teamMembers.map((member, index) => (
            <Card 
              key={member.name} 
              className="text-center hover:shadow-xl transition-all hover:-translate-y-2 animate-fade-in border-2 shadow-lg w-full" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-4 sm:pt-5 md:pt-6 space-y-3 sm:space-y-4">
                <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center shadow-md">
                  <User className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">{member.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{member.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
