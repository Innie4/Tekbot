'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { ArrowRight, PlayCircle } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-tech-dark via-tech-dark to-tech-dark/90 z-0" />
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-electric-blue/20 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-electric-cyan/20 rounded-full blur-3xl z-0" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
                Your AI Assistant,
              </span>{' '}
              Trained to Know Your Business
            </h1>
            
            <p className="text-xl text-foreground/80 max-w-lg">
              Upload your data, train your chatbot, and embed it on your site. Realtime updates, custom branding, and analytics built-in.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" variant="glass" className="group" asChild>
                <a href="/sign-up" className="inline-flex items-center">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#demo" className="inline-flex items-center">
                  See Live Demo
                  <PlayCircle className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
          
          {/* Animated chatbot preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <GlassCard className="w-full max-w-md p-1 overflow-hidden">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-tech-dark/50">
                <div className="absolute inset-0 p-6">
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="max-w-[70%] rounded-xl px-4 py-2 bg-glass text-white"
                    >
                      Hi! I\'m TekAssist. How can I help today?
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="ml-auto max-w-[65%] rounded-xl px-4 py-2 bg-electric-cyan text-white"
                    >
                      Show me pricing and integration options.
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="max-w-[75%] rounded-xl px-4 py-2 bg-glass text-white"
                    >
                      Sure! Try our Pro plan for advanced analytics and bookings.
                    </motion.div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-electric-blue to-electric-cyan flex items-center justify-center">
                      <span className="text-2xl font-bold">AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
        
        {/* Quick highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
        >
          {[
            { title: 'Multi-format Training', description: 'Docs, links, FAQs, and more' },
            { title: 'Realtime Retraining', description: 'Update content instantly as you grow' },
            { title: 'Custom Branding', description: 'Match colors, logo, and tone of voice' }
          ].map((item, index) => (
            <GlassCard key={index} className="p-6">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-foreground/70">{item.description}</p>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}