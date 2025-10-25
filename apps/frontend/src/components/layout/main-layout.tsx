'use client';

import Header from './header';
import Footer from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
