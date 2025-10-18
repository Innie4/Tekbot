'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { UploadCloud, MessageSquare, Code2, BarChart3, CheckCircle } from 'lucide-react';

type BotSummary = {
  name: string;
  trainedOn: string; // ISO date
  status: 'active' | 'training' | 'error';
  performance: string; // e.g., "92% satisfaction"
};

export default function AdminHome() {
  const [recentBots, setRecentBots] = useState<BotSummary[]>([]);

  const userName = useMemo(() => {
    try {
      if (typeof window === 'undefined') return 'there';
      const raw = localStorage.getItem('auth-user');
      if (!raw) return 'there';
      const obj = JSON.parse(raw);
      return obj?.name || obj?.fullName || obj?.firstName || obj?.email?.split('@')[0] || 'there';
    } catch {
      return 'there';
    }
  }, []);

  useEffect(() => {
    // Placeholder data until real bots API is available
    const sample: BotSummary[] = [
      { name: 'Support Assistant', trainedOn: new Date().toISOString(), status: 'active', performance: '92% satisfaction' },
      { name: 'Sales Guide', trainedOn: new Date(Date.now() - 86400000).toISOString(), status: 'training', performance: 'Training in progress' },
      { name: 'Docs Helper', trainedOn: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'active', performance: 'Avg. 2.3s response' },
    ];
    setRecentBots(sample);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const statusBadge = (status: BotSummary['status']) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    if (status === 'active') return <span className={`${base} bg-green-100 text-green-700`}>Active</span>;
    if (status === 'training') return <span className={`${base} bg-yellow-100 text-yellow-800`}>Training</span>;
    return <span className={`${base} bg-red-100 text-red-700`}>Error</span>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hey {userName}, Ready to train your next Tekbot?</h1>
            <p className="text-sm text-muted-foreground mt-1">Kickstart by uploading data or managing your existing bots.</p>
          </div>
          <Button asChild>
            <Link href="/onboarding">
              <CheckCircle className="h-4 w-4 mr-2" /> Start New Bot
            </Link>
          </Button>
        </div>
      </GlassCard>

      {/* Quick Action Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <Link href="/admin/training" className="block">
            <GlassCard className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <UploadCloud className="h-5 w-5 text-electric-cyan" />
                <div>
                  <p className="font-medium">Upload Data</p>
                  <p className="text-xs text-muted-foreground">Add documents, URLs, or text</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link href="/admin/chatbots" className="block">
            <GlassCard className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-electric-blue" />
                <div>
                  <p className="font-medium">View My Bots</p>
                  <p className="text-xs text-muted-foreground">Manage assistants and settings</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link href="/admin/widget" className="block">
            <GlassCard className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-electric-cyan" />
                <div>
                  <p className="font-medium">Get Embed Code</p>
                  <p className="text-xs text-muted-foreground">Install Tekbot on your site</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>

        <motion.div variants={item}>
          <Link href="/admin/analytics" className="block">
            <GlassCard className="p-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-electric-blue" />
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-xs text-muted-foreground">Track performance and insights</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      </motion.div>

      {/* Recent Bots Summary */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bots</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/chatbots">Manage Bots</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-6">Bot Name</th>
                <th className="py-2 pr-6">Trained On</th>
                <th className="py-2 pr-6">Status</th>
                <th className="py-2 pr-6">Performance Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {recentBots.map((bot) => (
                <tr key={bot.name}>
                  <td className="py-3 pr-6">{bot.name}</td>
                  <td className="py-3 pr-6">{new Date(bot.trainedOn).toLocaleDateString()}</td>
                  <td className="py-3 pr-6">{statusBadge(bot.status)}</td>
                  <td className="py-3 pr-6">{bot.performance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}