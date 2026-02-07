import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";

const Navbar = () => {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <Link to="/auth">
          <Button variant="outline" size="sm" className="font-medium">
            Sign In
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
