
"use client";
import HeroSection from '@/components/landing/hero-section';
import ServiceCards from '@/components/landing/service-cards';
import PricingSection from '@/components/landing/pricing-section';
import FeatureShowcase from '@/components/landing/feature-showcase';
import CtaSection from '@/components/landing/cta-section';
import ChatWidget from '@/components/chat/chat-widget';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">

      <ChatWidget />
    </main>
  );
}