
"use client";
import HeroSection from '@/components/landing/hero-section';
import HowItWorks from '@/components/landing/how-it-works';
import UseCases from '@/components/landing/use-cases';
import FeatureShowcase from '@/components/landing/feature-showcase';
import Testimonials from '@/components/landing/testimonials';
import PricingSection from '@/components/landing/pricing-section';
import ChatWidget from '@/components/chat/chat-widget';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full">
      <HeroSection />
      <HowItWorks />
      <UseCases />
      <FeatureShowcase />
      <Testimonials />
      <PricingSection />
      <section id="demo" className="w-full">
        <ChatWidget />
      </section>
    </main>
  );
}