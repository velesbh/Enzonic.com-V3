import { Link } from "react-router-dom";
import { Home, Languages, Shield, FileText, Settings, Server, Brain } from "lucide-react";

const apps = [
  { name: "Home", path: "/", icon: Home },
  { name: "Translate", path: "/translate", icon: Languages },
  { name: "Boxes", path: "/boxes", icon: Server },
  { name: "Emi", path: "/emi", icon: Brain },
  { name: "Admin", path: "/admin", icon: Settings },
  { name: "Terms", path: "/terms", icon: FileText },
  { name: "Privacy", path: "/privacy", icon: Shield },
];

const AppGrid = () => {
  return (
    <div className="w-80 p-5 bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl">
      <div className="grid grid-cols-3 gap-3">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <Link
              key={app.path}
              to={app.path}
              className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-muted/60 transition-all group hover:scale-105"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-all shadow-md group-hover:shadow-lg">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs text-center font-medium">{app.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AppGrid;
