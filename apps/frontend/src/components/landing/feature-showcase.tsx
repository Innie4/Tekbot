'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Zap,
  Clock,
  MessageSquare,
  BrainCircuit,
  Sparkles,
  Gauge,
  FileText,
  RefreshCcw,
  Palette,
  BarChart3,
  Calendar,
} from 'lucide-react';

const features = [
  {
    title: 'Multi-format Training',
    description: 'Ingest docs, links, FAQs, and structured content',
    icon: FileText,
  },
  {
    title: 'Realtime Retraining',
    description: 'Update your assistant instantly as content changes',
    icon: RefreshCcw,
  },
  {
    title: 'Custom Branding',
    description: 'Match colors, logo, and tone for a seamless experience',
    icon: Palette,
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track conversations, satisfaction, and conversion metrics',
    icon: BarChart3,
  },
  {
    title: 'Meeting Booking Integration',
    description: 'Connect calendars to let users schedule appointments',
    icon: Calendar,
  },
];

export default function FeatureShowcase() {
  return (
    <section className="py-20 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful{' '}
            <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Discover how our AI assistant transforms your technical support experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard className="h-full p-6 hover:scale-[1.02] transition-transform duration-300">
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-3 rounded-full bg-gradient-to-r from-electric-blue/20 to-electric-cyan/20 w-fit">
                    <feature.icon className="h-6 w-6 text-electric-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-foreground/70 flex-grow">{feature.description}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
