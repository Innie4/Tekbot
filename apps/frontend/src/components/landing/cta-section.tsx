'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="py-20 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl p-8 md:p-12 lg:p-16 bg-gradient-to-br from-tech-dark via-tech-dark to-tech-dark/90"
        >
          {/* Background effects */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-electric-blue/20 rounded-full blur-3xl z-0" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-electric-cyan/20 rounded-full blur-3xl z-0" />

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
                Technical Support Experience?
              </span>
            </h2>

            <p className="text-xl text-foreground/80 mb-8">
              Get started with TekAssist today and experience the power of AI-driven technical
              support.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="glass" className="group">
                Try It Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
