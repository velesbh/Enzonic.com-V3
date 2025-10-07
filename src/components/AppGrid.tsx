import { Link } from "react-router-dom";
import { Home, Languages, Server, Brain, Tv } from "lucide-react";

const apps = [
  { name: "Home", path: "/", icon: Home },
  { name: "Enzonic Emi", path: "/emi", icon: Brain },
  { name: "Boxes", path: "/boxes", icon: Server },
  { name: "Translate", path: "/translate", icon: Languages },
  { name: "Enzonic Shows", path: "/shows", icon: Tv },
];

const AppGrid = () => {
  return (
    <div className="w-80 p-6 bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl">
      <div className="grid grid-cols-3 gap-3">{apps.map((app) => {
          const Icon = app.icon;
          return (
            <Link
              key={app.path}
              to={app.path}
              className="flex flex-col items-center justify-start p-4 rounded-2xl hover:bg-muted/60 transition-all group hover:scale-105 min-h-[100px] text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-all shadow-md group-hover:shadow-lg">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs font-medium leading-tight break-words w-full px-1">{app.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AppGrid;
