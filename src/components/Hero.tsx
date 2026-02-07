import { Link } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 pt-24">
      {/* Badge */}
      <div className="mb-6 flex animate-fade-in items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-2 text-sm text-accent-foreground">
        <Leaf className="h-4 w-4" />
        <span>Never waste again</span>
      </div>

      {/* Headline */}
      <h1 className="mb-4 max-w-3xl animate-fade-in text-center text-4xl font-bold leading-tight tracking-tight text-foreground opacity-0 [animation-delay:100ms] sm:text-5xl md:text-6xl">
        Track expiry dates.
        <br />
        <span className="text-primary">Stay fresh.</span>
      </h1>

      {/* Subheadline */}
      <p className="mb-8 max-w-xl animate-fade-in text-center text-lg text-muted-foreground opacity-0 [animation-delay:200ms]">
        Scan products, organize your inventory, and receive smart reminders before anything expires.
      </p>

      {/* CTA */}
      <Link to="/auth">
        <Button
          size="lg"
          className="animate-fade-in gap-2 rounded-full px-8 opacity-0 [animation-delay:300ms]"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </section>
  );
};

export default Hero;
