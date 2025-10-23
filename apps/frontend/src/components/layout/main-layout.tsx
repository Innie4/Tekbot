'use client';

import { useEffect } from 'react';
import Header from './header';
import Footer from './footer';
import { SkipToContent } from '@/components/ui/skip-to-content';
import { setupSkipToContent } from '@/lib/utils/accessibility';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  useEffect(() => {
    // Setup accessibility features
    setupSkipToContent();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SkipToContent />
      <Header />
      <main id="main-content" className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
