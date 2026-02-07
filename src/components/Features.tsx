import { Camera, Bell, Shield } from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Camera,
    title: "Smart Scanning",
    description: "Snap a photo and AI extracts expiry dates automatically.",
  },
  {
    icon: Bell,
    title: "Timely Alerts",
    description: "Get notified before products expire—never waste again.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and only accessible by you.",
  },
];

const Features = () => {
  return (
    <section className="px-4 pb-24 pt-12">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={400 + index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
