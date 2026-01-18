import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SessionCard from '@/components/live/SessionCard.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, Calendar, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LiveSessions() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const sub = await base44.entities.UserSubscription.filter({
          user_email: userData.email,
          is_active: true,
        });
        if (sub.length > 0) {
          setUserTier(sub[0].tier);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => base44.entities.LiveSession.list('-scheduled_time'),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['my-registrations', user?.email],
    queryFn: () =>
      user ? base44.entities.SessionRegistration.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const registeredSessionIds = registrations.map(r => r.session_id);
  
  const now = new Date();
  const liveSessions = sessions.filter(s => s.is_live && !s.is_archived);
  const upcomingSessions = sessions.filter(s => new Date(s.scheduled_time) > now && !s.is_live && !s.is_archived);
  const pastSessions = sessions.filter(s => s.is_archived);

  const handleRegister = async (session) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    try {
      const hasAccess = 
        session.access_tier === 'one_time' ? false :
        userTier === 'collaborations' ? true :
        userTier === 'resonance_path' && ['member', 'resonance_path'].includes(session.access_tier) ? true :
        userTier === 'member' && session.access_tier === 'member' ? true :
        false;

      if (!hasAccess && session.access_tier === 'one_time') {
        toast.error('Payment integration required for one-time purchases');
        return;
      }

      if (!hasAccess) {
        toast.error('Please upgrade your membership to access this session');
        return;
      }

      await base44.entities.SessionRegistration.create({
        session_id: session.id,
        user_email: user.email,
        payment_status: 'included_in_tier',
      });

      await base44.entities.LiveSession.update(session.id, {
        current_attendees: (session.current_attendees || 0) + 1,
      });

      toast.success('Successfully registered!');
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
    } catch (error) {
      toast.error('Registration failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="bg-gradient-to-b from-purple-50/50 to-transparent border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-light mb-3" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.03em', color: 'hsl(var(--foreground))' }}>
            Live Sound Bath Sessions
          </h1>
          <div className="h-px w-32 mb-4" style={{ background: 'linear-gradient(to right, hsl(var(--accent)), transparent)' }} />
          <p className="text-lg" style={{ color: 'hsl(var(--text-muted))' }}>
            Join us for immersive live sessions with real-time guidance and community connection
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="live" className="space-y-8">
          <TabsList style={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}>
            <TabsTrigger value="live">
              <Radio className="w-4 h-4 mr-2" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past">
              <Archive className="w-4 h-4 mr-2" />
              Past Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            {liveSessions.length === 0 ? (
              <div className="text-center py-20">
                <Radio className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No live sessions at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    userTier={userTier}
                    isRegistered={registeredSessionIds.includes(session.id)}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No upcoming sessions scheduled</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    userTier={userTier}
                    isRegistered={registeredSessionIds.includes(session.id)}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastSessions.length === 0 ? (
              <div className="text-center py-20">
                <Archive className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
                <p style={{ color: 'hsl(var(--text-muted))' }}>No past sessions available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastSessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    userTier={userTier}
                    isRegistered={registeredSessionIds.includes(session.id)}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}