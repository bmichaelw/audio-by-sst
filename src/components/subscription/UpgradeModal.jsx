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
    price: '$9',
    period: '/month',
    description: 'Full access to our healing sound library',
    icon: Heart,
    features: [
      'Unlimited streaming',
      'All calming & balancing tracks',
      'Guided meditations',
      'New releases weekly',
    ],
    color: 'from-blue-600 to-indigo-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    id: 'resonance_path',
    name: 'ResonancePath',
    price: '$19',
    period: '/month',
    description: 'Deep journey with advanced practices',
    icon: Sparkles,
    popular: true,
    features: [
      'Everything in Member',
      'Advanced breathwork tracks',
      'Chakra-specific sessions',
      'Personalized recommendations',
      'Downloadable playlists',
    ],
    color: 'from-amber-600 to-orange-600',
    buttonColor: 'bg-amber-600 hover:bg-amber-500',
  },
  {
    id: 'collaborations',
    name: 'Collaborations',
    price: '$39',
    period: '/month',
    description: 'Exclusive artist collaborations',
    icon: Crown,
    features: [
      'Everything in ResonancePath',
      'Exclusive artist sessions',
      'Live workshops access',
      'Community circles',
      'Early access to new content',
    ],
    color: 'from-purple-600 to-pink-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-500',
    comingSoon: true,
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
      <DialogContent className="bg-stone-900 border-stone-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl md:text-3xl font-light text-white">
            Expand Your Practice
          </DialogTitle>
          <DialogDescription className="text-stone-400 text-base mt-2">
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
                className={cn(
                  "relative rounded-2xl p-6 border transition-all duration-300",
                  tier.popular
                    ? "border-amber-500/50 bg-stone-800/50"
                    : "border-stone-700/50 bg-stone-800/30",
                  "hover:border-stone-600"
                )}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white border-0">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
                    `bg-gradient-to-br ${tier.color}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-1">{tier.name}</h3>
                  <p className="text-stone-400 text-sm">{tier.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-light text-white">{tier.price}</span>
                  <span className="text-stone-400">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-stone-300">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full",
                    isCurrentTier
                      ? "bg-stone-700 text-stone-300 cursor-default"
                      : isComingSoon
                      ? "bg-stone-700 text-stone-400 cursor-not-allowed"
                      : tier.buttonColor + " text-white"
                  )}
                  disabled={isCurrentTier || isComingSoon}
                  onClick={() => !isCurrentTier && !isComingSoon && handleUpgrade(tier.id)}
                >
                  {isCurrentTier ? 'Current Plan' : isComingSoon ? 'Coming Soon' : 'Choose Plan'}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-stone-500 text-sm mt-6">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}