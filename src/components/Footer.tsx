import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
const Footer = () => {
  return <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto w-full">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Enzonic Logo" className="h-5 sm:h-6 w-5 sm:w-6" />
              <span className="font-bold text-sm sm:text-base">ENZONIC LLC</span>
            </div>
            <p className="text-xs text-muted-foreground">Empowering innovation and excellence.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm">Company</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm">Legal</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm">Contact</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="mailto:admin@enzonic.com" className="hover:text-primary transition-colors">
                  admin@enzonic.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Enzonic LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;