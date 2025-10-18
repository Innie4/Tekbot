'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'per month',
    description: 'Get started with core features',
    features: [
      'Basic AI chat support',
      'Multi-format data import',
      'Starter branding options',
      'Community support',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'Advanced features for growing teams',
    features: [
      'Everything in Free',
      'Realtime retraining',
      'Analytics dashboard',
      'Meeting booking integration',
      'Priority email support',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$99',
    period: 'per month',
    description: 'Scalable solution with premium support',
    features: [
      'Everything in Pro',
      'Custom branding presets',
      'SSO & roles',
      'Dedicated success manager',
      'SLA & uptime monitoring',
    ],
    highlighted: false,
  },
];

export default function PricingSection() {
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
            Simple <span className="bg-gradient-to-r from-electric-blue to-electric-cyan bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Choose the plan that fits your needs and get started with TekAssist today
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex"
            >
              <GlassCard 
                className={`flex flex-col h-full p-6 ${plan.highlighted ? 'border-electric-blue' : ''}`}
                variant={plan.highlighted ? 'default' : 'solid'}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-foreground/70 mb-4">{plan.description}</p>
                  <div className="flex items-end mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-foreground/70 ml-1">{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-electric-blue mr-2 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.highlighted ? 'glass' : 'outline'}
                  className="w-full mt-auto"
                >
                  Get Started
                </Button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}