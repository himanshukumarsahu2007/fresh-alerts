import { Leaf } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Leaf className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-semibold text-foreground">FreshTrack</span>
    </div>
  );
};

export default Logo;
