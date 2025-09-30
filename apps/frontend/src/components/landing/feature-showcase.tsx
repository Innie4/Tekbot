'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Zap, Clock, MessageSquare, BrainCircuit, Sparkles, Gauge } from 'lucide-react';

const features = [
  {
    title: 'AI-Powered Responses',
    description: 'Get intelligent answers based on Tekskillz Technology\'s knowledge base',
    icon: BrainCircuit,
  },
  {
    title: 'Instant Solutions',
    description: 'Receive immediate answers to your technical questions without waiting',
    icon: Zap,
  },
  {
    title: '24/7 Availability',
    description: 'Access support anytime, day or night, whenever you need assistance',
    icon: Clock,
  },
  {
    title: 'Natural Conversations',
    description: 'Interact naturally with our AI assistant just like chatting with a human',
    icon: MessageSquare,
  },
  {
    title: 'Continuous Learning',
    description: 'Our AI improves over time, learning from new issues and solutions',
    icon: Sparkles,
  },
  {
    title: 'High Performance',
    description: 'Optimized for speed and accuracy to solve your problems efficiently',
    icon: Gauge,
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
            Powerful <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">Features</span>
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