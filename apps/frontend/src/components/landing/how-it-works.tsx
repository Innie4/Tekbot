'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Upload, Bot, Code2 } from 'lucide-react';

const steps = [
  {
    title: 'Upload Data',
    description: 'Add docs, links, FAQs, and knowledge base content to train your AI.',
    icon: Upload,
  },
  {
    title: 'Train Chatbot',
    description: 'Our engine builds embeddings and learns your brand and tone instantly.',
    icon: Bot,
  },
  {
    title: 'Embed & Go Live',
    description: 'Grab a snippet and launch the widget on your site in minutes.',
    icon: Code2,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 w-full" id="how-it-works">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It{' '}
            <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            A simple flow to get your AI assistant live fast
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard className="h-full p-6">
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-3 rounded-full bg-gradient-to-r from-electric-blue/20 to-electric-cyan/20 w-fit">
                    <step.icon className="h-6 w-6 text-electric-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-foreground/70 flex-grow">{step.description}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
