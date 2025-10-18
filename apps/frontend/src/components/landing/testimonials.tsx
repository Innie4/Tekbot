'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';

const testimonials = [
  {
    quote: 'TekAssist reduced our support load by 40% within the first month.',
    author: 'Sarah M., Head of Customer Success',
    company: 'Acme SaaS',
  },
  {
    quote: 'We launched assistants for 5 clients in a week—branding was effortless.',
    author: 'Daniel K., Agency Director',
    company: 'BlueRiver Agency',
  },
  {
    quote: 'Checkout questions dropped, conversions improved—our customers get instant answers.',
    author: 'Priya N., E-commerce Lead',
    company: 'Shoply',
  },
];

const brands = ['Acme', 'BlueRiver', 'Shoply', 'NovaTech', 'Orbit'];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // Guard against empty array and compute the current testimonial safely
  if (testimonials.length === 0) {
    return null;
  }
  const current = testimonials[index % testimonials.length];
  if (!current) {
    return null;
  }

  return (
    <section className="py-20 w-full" id="testimonials">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">Teams</span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            See what customers say about launching AI assistants with TekAssist
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <GlassCard className="p-8">
            <div className="relative h-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <p className="text-lg md:text-xl">“{current.quote}”</p>
                  <p className="mt-4 text-sm text-foreground/70">
                    {current.author} — {current.company}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 items-center">
          {brands.map((brand, i) => (
            <div key={i} className="flex items-center justify-center">
              <div className="w-28 h-10 rounded-lg bg-gradient-to-r from-electric-blue/10 to-electric-cyan/10 border border-border/10 flex items-center justify-center text-sm text-foreground/70">
                {brand}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}