import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Hero />
      <HowItWorks />
      <Pricing />
    </div>
  );
}
