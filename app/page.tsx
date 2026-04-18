import { SiteHeader } from "@/components/site-header";
import { CTASection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { LandingFooter } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ProblemsSection } from "@/components/landing/problems-section";
import { TestimonialSection } from "@/components/landing/testimonial-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ProblemsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <TestimonialSection />
        <CTASection />
      </main>
      <LandingFooter />
    </>
  );
}
