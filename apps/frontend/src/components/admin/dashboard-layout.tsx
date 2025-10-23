'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Settings,
  HelpCircle,
  BarChart3,
  MessageSquare,
  Puzzle,
  Menu,
  X,
  FileText,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import TenantSelector from '@/components/admin/tenant-selector';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/admin' },
  { icon: MessageSquare, label: 'My Chatbots', href: '/admin/chatbots' },
  { icon: FileText, label: 'Training Data', href: '/admin/training' },
  { icon: Puzzle, label: 'Integrations', href: '/admin/integrations' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        window.location.href = '/sign-in';
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('tenant-id');
      localStorage.removeItem('tenant-slug');
      // Optional: clear onboarding flag for a full reset
      // localStorage.removeItem('has-onboarded');
    } catch {}
    window.location.href = '/sign-in';
  };

  return (
    <div className="flex min-h-screen bg-tech-dark">
      {/* Desktop Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block w-64 p-4 border-r border-border/10"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
                  TekAssist Admin
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="md:flex lg:hidden"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 space-y-2">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-electric-blue" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-3">
                <GlassCard className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Need help?</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </GlassCard>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="sticky top-0 z-10 glass-effect border-b border-border/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="hidden md:flex"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>

            <div className="flex items-center gap-2">
              <TenantSelector />
              <Button variant="outline" size="sm">
                Profile
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden glass-effect border-b border-border/10 p-4"
            >
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 text-electric-blue" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
