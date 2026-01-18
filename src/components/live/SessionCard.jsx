import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Radio, Lock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const tierLabels = {
  member: 'Member+',
  resonance_path: 'ResonancePath+',
  collaborations: 'Collaborations',
  one_time: 'One-Time Purchase',
};

export default function SessionCard({ session, userTier, isRegistered, onRegister }) {
  const scheduledDate = new Date(session.scheduled_time);
  const isUpcoming = scheduledDate > new Date();
  const hasAccess = 
    session.access_tier === 'one_time' ? isRegistered :
    userTier === 'collaborations' ? true :
    userTier === 'resonance_path' && ['member', 'resonance_path'].includes(session.access_tier) ? true :
    userTier === 'member' && session.access_tier === 'member' ? true :
    false;
  
  const isFull = session.max_attendees && session.current_attendees >= session.max_attendees;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      {/* Cover Image */}
      {session.cover_image_url ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={session.cover_image_url}
            alt={session.title}
            className="w-full h-full object-cover"
          />
          {session.is_live && (
            <Badge className="absolute top-3 right-3 bg-red-600 text-white border-0 animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-600/20 to-amber-600/20 flex items-center justify-center">
          <Radio className="w-16 h-16" style={{ color: 'hsl(var(--text-subtle))' }} />
        </div>
      )}

      <CardContent className="pt-4">
        <h3 className="text-xl font-medium mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
          {session.title}
        </h3>
        
        {session.description && (
          <p className="text-sm mb-4 line-clamp-2" style={{ color: 'hsl(var(--text-muted))' }}>
            {session.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2" style={{ color: 'hsl(var(--text-body))' }}>
            <Calendar className="w-4 h-4" />
            {format(scheduledDate, 'EEEE, MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-2" style={{ color: 'hsl(var(--text-body))' }}>
            <Clock className="w-4 h-4" />
            {format(scheduledDate, 'h:mm a')} · {session.duration_minutes} min
          </div>
          {session.max_attendees && (
            <div className="flex items-center gap-2" style={{ color: 'hsl(var(--text-body))' }}>
              <Users className="w-4 h-4" />
              {session.current_attendees || 0} / {session.max_attendees} registered
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          {session.access_tier === 'one_time' ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${session.one_time_price}
            </Badge>
          ) : (
            <Badge variant="outline">
              <Lock className="w-3 h-3 mr-1" />
              {tierLabels[session.access_tier]}
            </Badge>
          )}
          {isFull && <Badge className="bg-amber-600">Full</Badge>}
        </div>
      </CardContent>

      <CardFooter>
        {session.is_live ? (
          <Link to={createPageUrl('LiveSessionViewer') + `?session=${session.id}`} className="w-full">
            <Button className="w-full" disabled={!hasAccess} style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              {hasAccess ? 'Join Live Session' : 'Register to Join'}
            </Button>
          </Link>
        ) : isUpcoming ? (
          <Button
            className="w-full"
            onClick={() => onRegister(session)}
            disabled={isRegistered || isFull || !isUpcoming}
            style={isRegistered ? { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' } : { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {isRegistered ? 'Registered' : isFull ? 'Session Full' : hasAccess ? 'Register for Free' : `Purchase for $${session.one_time_price}`}
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            Past Session
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}