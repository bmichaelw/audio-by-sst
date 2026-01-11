import React from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Heart, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const tiers = [
  {
    id: 'member',
    name: 'Member',
    price: '$2.99',
    period: '/month',
    description: 'Full access to therapeutic sound library',
    icon: Heart,
    popular: true,
    features: [
      'Unlimited streaming',
      'All calming & balancing tracks',
      'Guided meditations',
      'New releases weekly',
      'Download for offline',
      'No ads',
    ],
    color: 'from-blue-600 to-indigo-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    id: 'resonance_path',
    name: 'ResonancePath',
    price: '$9.99',
    period: '/month',
    description: 'Deep journey with advanced practices',
    icon: Sparkles,
    features: [
      'Everything in Member',
      'Advanced breathwork tracks',
      'Chakra-specific sessions',
      'Personalized recommendations',
      'Priority support',
      'Exclusive workshops',
    ],
    color: 'from-amber-600 to-orange-600',
    buttonColor: 'bg-amber-600 hover:bg-amber-500',
  },
  {
    id: 'collaborations',
    name: 'Collaborations',
    price: '$19.99',
    period: '/month',
    description: 'Exclusive artist collaborations',
    icon: Crown,
    features: [
      'Everything in ResonancePath',
      'Exclusive artist sessions',
      'Live workshops access',
      'Community circles',
      'Early access to new content',
      '1-on-1 guidance sessions',
    ],
    color: 'from-purple-600 to-pink-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-500',
  },
];

export default function UpgradeModal({ isOpen, onClose, currentTier }) {
  const handleUpgrade = (tierId) => {
    base44.analytics.track({
      eventName: 'upgrade_click',
      properties: { tier: tierId, from_tier: currentTier || 'free' },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl md:text-3xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading))' }}>
            Expand Your Practice
          </DialogTitle>
          <DialogDescription className="text-base mt-2" style={{ color: 'hsl(var(--text-muted))' }}>
            Choose a path that resonates with your journey
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isCurrentTier = currentTier === tier.id;
            const isComingSoon = tier.comingSoon;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: tier.popular ? 'hsl(var(--surface-elevated))' : 'hsl(var(--card))',
                  borderColor: tier.popular ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))'
                }}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: `linear-gradient(to bottom right, ${tier.color.replace('from-', '').replace(' to-', ', ')})` }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>{tier.name}</h3>
                  <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>{tier.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading))' }}>{tier.price}</span>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: 'hsl(var(--text-body))' }}>
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  style={isCurrentTier ? 
                    { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-muted))' } : 
                    isComingSoon ? 
                      { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-subtle))' } : 
                      { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  disabled={isCurrentTier || isComingSoon}
                  onClick={() => !isCurrentTier && !isComingSoon && handleUpgrade(tier.id)}
                >
                  {isCurrentTier ? 'Current Plan' : isComingSoon ? 'Coming Soon' : 'Choose Plan'}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--text-muted))' }}>
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}