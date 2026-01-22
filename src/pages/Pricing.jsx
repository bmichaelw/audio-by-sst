import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Heart, Crown, ArrowRight, Loader2, Mic } from 'lucide-react';
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
    id: 'artist',
    name: 'Artist',
    price: '$19.99',
    period: '/month',
    description: 'Share your healing sounds with the community',
    icon: Mic,
    features: [
      'Upload unlimited tracks',
      'Host live sessions',
      'Create artist collections',
      'Listener subscription features',
      'Analytics dashboard',
      'Admin approval required',
    ],
    color: 'from-amber-600 to-orange-600',
    priceId: 'price_artist_monthly', // Replace with actual Stripe Price ID
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
      // Testing mode: auto-subscribe user without Stripe
      const existingSubscriptions = await base44.entities.UserSubscription.filter({
        user_email: user.email,
        is_active: true,
      });

      // Deactivate existing subscriptions
      for (const sub of existingSubscriptions) {
        await base44.entities.UserSubscription.update(sub.id, { is_active: false });
      }

      // Create new subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

      await base44.entities.UserSubscription.create({
        user_email: user.email,
        tier: tier.id,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      });

      // Update current tier state
      setCurrentTier(tier.id);
      toast.success(`Successfully subscribed to ${tier.name}!`);
      
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
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
    <div className="min-h-screen py-16 px-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="bg-purple-100 text-purple-900 border-purple-200 mb-6">
            <Sparkles className="w-3 h-3 mr-1" />
            Sacred Investment
          </Badge>
          <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: 'hsl(var(--text-heading))', fontFamily: 'var(--font-heading))' }}>
            Membership Tiers
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--text-body))' }}>
            Choose the path that resonates with your healing journey
          </p>
        </motion.div>

        {/* Current Subscription Banner */}
        {user && currentTier !== 'free' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 max-w-2xl mx-auto"
          >
            <Card style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', borderColor: 'hsl(var(--accent) / 0.3)' }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--accent))' }} />
                  <span style={{ color: 'hsl(var(--foreground))' }}>
                    Current plan: <span className="font-medium capitalize">{currentTier.replace('_', ' ')}</span>
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--accent))' }}
                >
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                    "relative h-full border transition-all duration-300 hover:shadow-lg",
                    tier.popular && "shadow-md"
                  )}
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

                  <CardHeader className="text-center pb-4">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ background: `linear-gradient(to bottom right, ${tier.color.replace('from-', '').replace('to-', ', ')})` }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-1" style={{ color: 'hsl(var(--foreground))' }}>{tier.name}</CardTitle>
                    <CardDescription className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                      {tier.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-light" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading))' }}>{tier.price}</span>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>{tier.period}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--text-body))' }}>
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      style={isCurrentTier ? 
                        { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-muted))' } : 
                        tier.id === 'free' ? 
                          { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' } : 
                          { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
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
          className="text-center text-sm space-y-2"
          style={{ color: 'hsl(var(--text-muted))' }}
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
          <Card style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}>
            <CardContent className="p-6">
              <h3 className="font-medium mb-2" style={{ color: 'hsl(var(--accent))' }}>🔧 Backend Functions Required</h3>
              <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
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