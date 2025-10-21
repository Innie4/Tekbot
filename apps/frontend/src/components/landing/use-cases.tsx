'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Building2, Users, ShoppingCart, GraduationCap, Rocket } from 'lucide-react';

const useCases = [
  {
    title: 'SaaS Companies',
    description: 'Reduce support tickets with an AI that knows your product and docs.',
    icon: Building2,
  },
  {
    title: 'Agencies',
    description: 'Offer branded assistants for clients with fast setup and analytics.',
    icon: Users,
  },
  {
    title: 'E-commerce',
    description: 'Answer product questions, track orders, and improve conversion rates.',
    icon: ShoppingCart,
  },
  {
    title: 'Coaches',
    description: 'Scale your knowledge with a coach-trained assistant and bookings.',
    icon: GraduationCap,
  },
  {
    title: 'Startups',
    description: 'Launch quickly with a reliable AI assistant that grows with you.',
    icon: Rocket,
  },
];

export default function UseCases() {
  return (
    <section className="py-20 w-full bg-tech-dark/50" id="use-cases">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Use{' '}
            <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
              Cases
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Proven scenarios where your AI assistant adds immediate value
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((item, index) => (
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
                    <item.icon className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-foreground/70 flex-grow">{item.description}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
