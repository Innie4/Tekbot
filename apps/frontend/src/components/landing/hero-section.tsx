'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { ArrowRight } from 'lucide-react';

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
                AI-Powered
              </span>{' '}
              Tech Support Assistant
            </h1>
            
            <p className="text-xl text-foreground/80 max-w-lg">
              Get instant solutions to your technical problems with our AI assistant trained on Tekskillz Technology's knowledge base.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" variant="glass" className="group">
                Try It Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </motion.div>
          
          {/* Hero image/illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <GlassCard className="w-full max-w-md p-1 overflow-hidden">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-tech-dark/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-electric-blue to-electric-cyan flex items-center justify-center">
                      <span className="text-2xl font-bold">AI</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">TekAssist Demo</h3>
                    <p className="text-sm text-foreground/70">Interactive AI assistant preview</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
        
        {/* Stats or features highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
        >
          {[
            { title: '24/7 Support', description: 'Get help anytime, anywhere with our always-on AI assistant' },
            { title: 'Instant Solutions', description: 'Receive immediate answers to your technical questions' },
            { title: 'Expert Knowledge', description: 'Powered by Tekskillz Technology\'s extensive knowledge base' }
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