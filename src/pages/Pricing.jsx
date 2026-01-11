import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Heart, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const tiers = [
  {
    id: 'free',
    name: 'Free Sample',
    price: '$0',
    period: '/forever',
    description: 'Explore our healing sound collection',
    icon: Heart,
    features: [
      'Access to free sample tracks',
      'Basic filtering and search',
      'Streaming audio player',
      'Mobile-friendly experience',
    ],
    color: 'from-stone-600 to-stone-700',
    priceId: null,
  },
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
    priceId: 'price_member_monthly', // Replace with actual Stripe Price ID
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
    priceId: 'price_resonance_monthly', // Replace with actual Stripe Price ID
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
    priceId: 'price_collaborations_monthly', // Replace with actual Stripe Price ID
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentTier, setCurrentTier] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch user's subscription
        const subscriptions = await base44.entities.UserSubscription.filter({
          user_email: userData.email,
          is_active: true,
        });
        
        if (subscriptions.length > 0) {
          setCurrentTier(subscriptions[0].tier);
        }
      } catch {
        // Not logged in
        setUser(null);
      }
    };
    fetchUserData();
  }, []);

  const handleSubscribe = async (tier) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (tier.id === 'free') {
      toast.info('You already have free access');
      return;
    }

    setLoadingTier(tier.id);
    setIsLoading(true);

    try {
      // TODO: Call backend function to create Stripe checkout session
      // For now, show placeholder
      toast.info('Stripe integration requires backend functions to be enabled');
      
      // Example of what the backend call would look like:
      // const { sessionUrl } = await base44.functions.createCheckoutSession({
      //   priceId: tier.priceId,
      //   successUrl: window.location.origin + '/subscription-success',
      //   cancelUrl: window.location.origin + '/pricing',
      // });
      // window.location.href = sessionUrl;
      
    } catch (error) {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      // TODO: Call backend function to create customer portal session
      toast.info('Customer portal requires backend functions to be enabled');
      
      // Example:
      // const { portalUrl } = await base44.functions.createPortalSession({
      //   returnUrl: window.location.href,
      // });
      // window.location.href = portalUrl;
      
    } catch (error) {
      toast.error('Failed to open subscription management');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="bg-amber-600/10 text-amber-400 border-amber-600/20 mb-6">
            <Sparkles className="w-3 h-3 mr-1" />
            Choose Your Path
          </Badge>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Pricing & Plans
          </h1>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            Start your healing journey with the plan that fits your practice
          </p>
        </motion.div>

        {/* Current Subscription Banner */}
        {user && currentTier !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 max-w-2xl mx-auto"
          >
            <Card className="bg-amber-600/10 border-amber-600/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-white">
                    Current plan: <span className="font-medium capitalize">{currentTier.replace('_', ' ')}</span>
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="border-amber-600/30 text-amber-400 hover:bg-amber-600/10"
                >
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isCurrentTier = currentTier === tier.id;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "relative h-full border transition-all duration-300",
                    tier.popular
                      ? "border-amber-500/50 bg-stone-800/50 shadow-lg shadow-amber-500/10"
                      : "border-stone-700/50 bg-stone-800/30",
                    "hover:border-stone-600 hover:shadow-xl"
                  )}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white border-0">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
                        `bg-gradient-to-br ${tier.color}`
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white mb-1">{tier.name}</CardTitle>
                    <CardDescription className="text-stone-400 text-sm">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-light text-white">{tier.price}</span>
                      <span className="text-stone-400">{tier.period}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-stone-300">
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
                          : tier.id === 'free'
                          ? "bg-stone-700 hover:bg-stone-600 text-white"
                          : "bg-amber-600 hover:bg-amber-500 text-white"
                      )}
                      disabled={isCurrentTier || isLoading}
                      onClick={() => handleSubscribe(tier)}
                    >
                      {loadingTier === tier.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {isCurrentTier ? 'Current Plan' : tier.id === 'free' ? 'Get Started' : 'Subscribe'}
                      {!isCurrentTier && tier.id !== 'free' && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ / Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-stone-400 text-sm space-y-2"
        >
          <p>All paid plans include a 7-day free trial</p>
          <p>Cancel anytime • No long-term contracts • Secure payments via Stripe</p>
        </motion.div>

        {/* Backend Integration Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <Card className="bg-stone-800/30 border-stone-700/50">
            <CardContent className="p-6">
              <h3 className="text-amber-400 font-medium mb-2">🔧 Backend Functions Required</h3>
              <p className="text-stone-400 text-sm">
                To enable Stripe payments, backend functions need to be activated in your Base44 dashboard.
                This will allow secure webhook handling and subscription management.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}