'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Laptop, Server, Shield, Smartphone, HelpCircle, Database } from 'lucide-react';

const services = [
  {
    title: 'Hardware Support',
    description: 'Troubleshooting and solutions for all your hardware-related issues',
    icon: Laptop,
  },
  {
    title: 'Software Assistance',
    description: 'Help with software installation, updates, and configuration',
    icon: Server,
  },
  {
    title: 'Security Solutions',
    description: 'Protect your systems with our advanced security recommendations',
    icon: Shield,
  },
  {
    title: 'Mobile Support',
    description: 'Expert assistance for your mobile device problems',
    icon: Smartphone,
  },
  {
    title: 'General IT Help',
    description: 'General technical support for all your IT needs',
    icon: HelpCircle,
  },
  {
    title: 'Data Management',
    description: 'Solutions for data backup, recovery, and management',
    icon: Database,
  },
];

export default function ServiceCards() {
  return (
    <section className="py-20 w-full bg-tech-dark/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Comprehensive technical support powered by AI to solve your problems quickly and efficiently
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
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
                    <service.icon className="h-6 w-6 text-electric-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-foreground/70 flex-grow">{service.description}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}