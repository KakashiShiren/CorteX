import { redirect } from "next/navigation";

import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { LandingFooter } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SocialProofBar } from "@/components/landing/social-proof-bar";
import { UniversitiesSection } from "@/components/landing/universities-section";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";

export default function HomePage() {
  const session = getSession();

  if (session?.isVerified) {
    redirect("/feed");
  }

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip bg-[#f6efe2] text-[#12110f] transition-colors duration-300 dark:bg-[#120f0e] dark:text-[#f7efe3]">
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <HowItWorksSection />
        <UniversitiesSection />
        <CTASection />
      </main>
      <LandingFooter />
    </>
  );
}
