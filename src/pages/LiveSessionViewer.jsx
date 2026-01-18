import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LiveChat from '@/components/live/LiveChat.jsx';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LiveSessionViewer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const sessions = await base44.entities.LiveSession.filter({ id: sessionId });
      return sessions[0];
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        if (!session) return;

        // Check if registered
        const registrations = await base44.entities.SessionRegistration.filter({
          session_id: sessionId,
          user_email: userData.email,
        });

        if (registrations.length > 0) {
          setHasAccess(true);
          
          // Mark as attended
          if (!registrations[0].attended) {
            await base44.entities.SessionRegistration.update(registrations[0].id, {
              attended: true,
            });
          }
        }
      } catch {
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    };

    if (session) {
      checkAccess();
    }
  }, [session, sessionId]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center">
          <p style={{ color: 'hsl(var(--text-muted))' }}>Session not found</p>
          <Button onClick={() => navigate(createPageUrl('LiveSessions'))} className="mt-4">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-medium mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            Access Required
          </h2>
          <p className="mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
            You need to register for this session to access the live stream.
          </p>
          <Button onClick={() => navigate(createPageUrl('LiveSessions'))}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('LiveSessions'))}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
          <h1 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {session.title}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
              {session.stream_url ? (
                <div className="relative pb-[56.25%]">
                  <iframe
                    src={session.stream_url}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <p style={{ color: 'hsl(var(--text-muted))' }}>Stream will appear here when live</p>
                </div>
              )}
            </div>

            {session.description && (
              <div className="mt-6 p-6 rounded-xl border" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
                <h3 className="font-medium mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  About This Session
                </h3>
                <p style={{ color: 'hsl(var(--text-body))' }}>{session.description}</p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border overflow-hidden h-[600px]" style={{ borderColor: 'hsl(var(--border))' }}>
              {user && <LiveChat sessionId={sessionId} user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}